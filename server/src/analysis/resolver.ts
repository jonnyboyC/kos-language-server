import {
  IInstVisitor,
  IExpr,
  IInst,
  ScopeType,
  ISuffixTerm,
  IScript,
  IExprVisitor,
  ISuffixTermVisitor,
} from '../parser/types';
import * as SuffixTerm from '../parser/suffixTerm';
import * as Expr from '../parser/expr';
import * as Inst from '../parser/inst';
import * as Decl from '../parser/declare';
import { empty } from '../utilities/typeGuards';
import { LocalResolver } from './localResolver';
import { SetResolver } from './setResolver';
import { TokenType } from '../entities/tokentypes';
import { Script } from '../entities/script';
import { mockLogger, mockTracer } from '../utilities/logger';
import { SymbolTableBuilder } from './symbolTableBuilder';
import { ILocalResult, IScopePath } from './types';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { createDiagnostic } from '../utilities/diagnosticsUtils';
import { sep } from 'path';
import { IToken } from '../entities/types';
// tslint:disable-next-line: import-name
import Denque from 'denque';

type Diagnostics = Diagnostic[];
interface IDeferred {
  path: IScopePath;
  node: IInst;
}

export class Resolver
  implements
    IInstVisitor<Diagnostics>,
    IExprVisitor<Diagnostics>,
    ISuffixTermVisitor<Diagnostics> {
  private readonly script: Script;
  private readonly tableBuilder: SymbolTableBuilder;
  private readonly logger: ILogger;
  private readonly tracer: ITracer;
  private readonly localResolver: LocalResolver;
  private readonly setResolver: SetResolver;
  private readonly deferred: any;
  private lazyGlobal: boolean;
  private firstInst: boolean;
  private initialPass: boolean;

  constructor(
    script: IScript,
    symbolTableBuilder: SymbolTableBuilder,
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer,
  ) {
    this.script = script;
    this.tableBuilder = symbolTableBuilder;
    this.localResolver = new LocalResolver();
    this.setResolver = new SetResolver(this.localResolver);
    this.deferred = new Denque();
    this.lazyGlobal = true;
    this.firstInst = true;
    this.initialPass = true;
    this.logger = logger;
    this.tracer = tracer;
  }

  // resolve the sequence of instructions
  public resolve(): Diagnostics {
    try {
      const splits = this.script.uri.split(sep);
      const file = splits[splits.length - 1];

      this.logger.info(`Resolving started for ${file}.`);

      this.tableBuilder.rewind();
      this.tableBuilder.beginScope(this.script);
      const [firstInst, ...restInsts] = this.script.insts;

      // check for lazy global flag
      const firstError = this.resolveInst(firstInst);
      this.firstInst = false;

      // resolve reset
      const resolveErrors = this.resolveInsts(restInsts);
      this.tableBuilder.endScope();

      this.script.lazyGlobal = this.lazyGlobal;
      this.initialPass = false;

      // process all deferred nodes
      let current: Maybe<IDeferred>;
      let allErrors = firstError.concat(resolveErrors);

      // process deferred queue
      while (current = this.deferred.pop()) {

        // set scope path
        this.tableBuilder.setPath(current.path);

        // resolve deferred node
        allErrors = allErrors.concat(this.resolveInst(current.node));
      }

      this.logger.info(`Resolving finished for ${file}`);

      if (allErrors.length) {
        this.logger.warn(`Resolver encounted ${allErrors.length} errors`);
      }
      return allErrors;
    } catch (err) {
      this.logger.error(`Error occured in resolver ${err}`);
      this.tracer.log(err);

      return [];
    }
  }

  /**
   * Resolve the given set of instructions
   * @param insts instructions
   */
  private resolveInsts(insts: IInst[]): Diagnostics {
    return accumulateErrors(insts, this.resolveInst.bind(this));
  }

  /**
   * Resolve instruction
   * @param inst resolve instruction
   */
  private resolveInst(inst: IInst): Diagnostics {
    return inst.accept(this);
  }

  /**
   * Pass through expression
   * @param expr expression to skip
   */
  private resolveExpr(expr: IExpr): Diagnostics {
    return expr.accept(this);
  }

  /**
   * Pass through suffix term
   * @param suffixTerm suffix term to skip
   */
  private resolveSuffixTerm(suffixTerm: ISuffixTerm): Diagnostics {
    return suffixTerm.accept(this);
  }

  /**
   * attempt to use ever variable in the expression
   * @param expr expression to use
   */
  private useExprLocals(expr: IExpr): Diagnostics {
    return this.useTokens(this.localResolver.resolveExpr(expr));
  }

  /**
   * attempt to use ever token in the collection
   * @param results local results to use
   */
  private useTokens(results: ILocalResult[]): Diagnostics {
    return results
      .map(({ token, expr }) => this.tableBuilder.useSymbol(token, expr))
      .filter(this.filterError);
  }

  /**
   * filter to just errors
   * @param maybeError potential error
   */
  private filterError(maybeError: Maybe<Diagnostic>): maybeError is Diagnostic {
    return !empty(maybeError);
  }

  /* --------------------------------------------

  Declarations

  ----------------------------------------------*/

  /**
   * Visit the declare variable syntax node
   * @param decl the syntax node
   */
  public visitDeclVariable(decl: Decl.Var): Diagnostics {
    // determine scope type
    const scopeType = !empty(decl.scope) ? decl.scope.type : ScopeType.global;

    const declareError = this.tableBuilder.declareVariable(
      scopeType,
      decl.identifier,
    );
    const useErrors = this.useExprLocals(decl.value);
    const resolveErrors = this.resolveExpr(decl.value);

    return empty(declareError)
      ? useErrors.concat(resolveErrors)
      : useErrors.concat(declareError, resolveErrors);
  }

  /**
   * Visit the declare lock syntax node
   * @param decl the syntax node
   */
  public visitDeclLock(decl: Decl.Lock): Diagnostic[] {
    // determine scope type
    const scopeType = !empty(decl.scope) ? decl.scope.type : ScopeType.global;

    const lookup = this.tableBuilder.lookupLock(
      decl.identifier,
      ScopeType.global,
    );
    let declareError: Maybe<Diagnostic> = undefined;

    if (empty(lookup)) {
      declareError = this.tableBuilder.declareLock(scopeType, decl.identifier);
    }

    const useErrors = this.useExprLocals(decl.value);
    const resolveErrors = this.resolveExpr(decl.value);

    return empty(declareError)
      ? useErrors.concat(resolveErrors)
      : useErrors.concat(declareError, resolveErrors);
  }

  /**
   * Visit the declare function syntax node
   * @param decl the syntax node
   */
  public visitDeclFunction(decl: Decl.Func): Diagnostic[] {
    if (this.initialPass) {
      return this.deferNode(decl);
    }

    return this.resolveInst(decl.block);
  }

  /**
   * Visit the declare parameter syntax node
   * @param decl the syntax node
   */
  public visitDeclParameter(decl: Decl.Param): Diagnostic[] {
    const scopeError: Maybe<Diagnostic>[] = [];

    // check that parameter isn't declared global
    if (!empty(decl.scope) && !empty(decl.scope.scope)) {
      if (decl.scope.scope.type === TokenType.global) {
        scopeError.push(
          createDiagnostic(
            decl.scope.scope,
            'Parameters cannot be global',
            DiagnosticSeverity.Error,
          ),
        );
      }
    }

    // all parameters are local
    const scopeType = ScopeType.local;

    // need to check if default paraemter can really be abbitrary expr
    const parameterErrors = decl.parameters.map(parameter =>
      this.tableBuilder.declareParameter(
        scopeType,
        parameter.identifier,
        false,
      ),
    );
    const defaultParameterErrors = decl.defaultParameters.map(parameter =>
      this.tableBuilder.declareParameter(scopeType, parameter.identifier, true),
    );
    const defaultUseErrors = decl.defaultParameters.map(parameter =>
      this.useExprLocals(parameter.value),
    );

    return scopeError
      .concat(parameterErrors, defaultParameterErrors, ...defaultUseErrors)
      .filter(this.filterError);
  }

  /* --------------------------------------------

  Instructions

  ----------------------------------------------*/

  /**
   * Visit the Invalid Inst syntax node
   * @param inst the syntax node
   */
  public visitInstInvalid(_: Inst.Invalid): Diagnostics {
    return [];
  }

  /**
   * Visit the Block Inst syntax node
   * @param inst the syntax node
   */
  public visitBlock(inst: Inst.Block): Diagnostics {
    this.tableBuilder.beginScope(inst);
    const errors = this.resolveInsts(inst.insts);
    this.tableBuilder.endScope();

    return errors;
  }

  /**
   * Visit the Expr Inst syntax node
   * @param inst the syntax node
   */
  public visitExpr(inst: Inst.ExprInst): Diagnostics {
    return this.useExprLocals(inst.suffix).concat(
      this.resolveExpr(inst.suffix),
    );
  }

  /**
   * Visit the On Off Inst syntax node
   * @param inst the syntax node
   */
  public visitOnOff(inst: Inst.OnOff): Diagnostics {
    return this.useExprLocals(inst.suffix).concat(
      this.resolveExpr(inst.suffix),
    );
  }

  /**
   * Visit the Command Inst syntax node
   * @param inst the syntax node
   */
  public visitCommand(_: Inst.Command): Diagnostics {
    return [];
  }

  /**
   * Visit the Command Expr Inst syntax node
   * @param inst the syntax node
   */
  public visitCommandExpr(inst: Inst.CommandExpr): Diagnostics {
    return this.useExprLocals(inst.expr).concat(this.resolveExpr(inst.expr));
  }

  /**
   * Visit the Unset Inst syntax node
   * @param inst the syntax node
   */
  public visitUnset(inst: Inst.Unset): Diagnostics {
    const error = this.tableBuilder.useVariable(inst.identifier);
    return empty(error) ? [] : [error];
  }

  /**
   * Visit the Unlock Inst syntax node
   * @param inst the syntax node
   */
  public visitUnlock(inst: Inst.Unlock): Diagnostics {
    const error = this.tableBuilder.useLock(inst.identifier);
    return empty(error) ? [] : [error];
  }

  /**
   * Visit the Set Inst syntax node
   * @param inst the syntax node
   */
  public visitSet(inst: Inst.Set): Diagnostics {
    const { set, used } = this.setResolver.resolveExpr(inst.suffix);

    // check if a set target exists
    if (empty(set)) {
      const [{ token }] = this.localResolver.resolveExpr(inst.suffix);
      return [
        createDiagnostic(
          token,
          `cannot assign to variable ${token.lexeme}`,
          DiagnosticSeverity.Error,
        ),
      ];
    }

    const setError = this.setVariable(set);

    const useValueErrors = this.useExprLocals(inst.value);
    const useInternalErrors = this.useTokens(used);
    const resolveErrors = this.resolveExpr(inst.value);

    return useValueErrors.concat(useInternalErrors, resolveErrors, setError);
  }

  /**
   * Visit the Lazy Global Inst syntax node
   * @param inst the syntax node
   */
  public visitLazyGlobal(inst: Inst.LazyGlobal): Diagnostics {
    // It is an error if lazy global is not at the start of a file
    if (!this.firstInst) {
      return [
        createDiagnostic(
          inst.lazyGlobal,
          'Lazy global was not declared at top of the file',
          DiagnosticSeverity.Error,
        ),
      ];
    }

    this.lazyGlobal = inst.onOff.type === TokenType.on;
    return [];
  }

  /**
   * Visit the If Inst syntax node
   * @param inst the syntax node
   */
  public visitIf(inst: Inst.If): Diagnostics {
    const errors = this.useExprLocals(inst.condition).concat(
      this.resolveExpr(inst.condition),
      this.resolveInst(inst.ifInst),
    );

    if (inst.elseInst) {
      return errors.concat(this.resolveInst(inst.elseInst));
    }

    return errors;
  }

  /**
   * Visit the Else Inst syntax node
   * @param inst the syntax node
   */
  public visitElse(inst: Inst.Else): Diagnostics {
    return this.resolveInst(inst.inst);
  }

  /**
   * Visit the When Inst syntax node
   * @param inst the syntax node
   */
  public visitUntil(inst: Inst.Until): Diagnostics {
    return this.useExprLocals(inst.condition).concat(
      this.resolveExpr(inst.condition),
      this.resolveInst(inst.inst),
    );
  }

  /**
   * Visit the From Inst syntax node
   * @param inst the syntax node
   */
  public visitFrom(inst: Inst.From): Diagnostics {
    this.tableBuilder.beginScope(inst);

    const resolverErrors = this.resolveInsts(inst.initializer.insts).concat(
      this.resolveExpr(inst.condition),
      this.resolveInsts(inst.increment.insts),
      this.resolveInst(inst.inst),
    );

    const useErrors = this.useExprLocals(inst.condition);
    this.tableBuilder.endScope();

    return resolverErrors.concat(useErrors);
  }

  /**
   * Visit the When Inst syntax node
   * @param inst the syntax node
   */
  public visitWhen(inst: Inst.When): Diagnostics {
    if (this.initialPass) {
      return this.deferNode(inst);
    }

    return this.useExprLocals(inst.condition).concat(
      this.resolveExpr(inst.condition),
      this.resolveInst(inst.inst),
    );
  }

  /**
   * Visit the Return Inst syntax node
   * @param inst the syntax node
   */
  public visitReturn(inst: Inst.Return): Diagnostics {
    if (inst.expr) {
      return this.useExprLocals(inst.expr).concat(this.resolveExpr(inst.expr));
    }

    return [];
  }

  /**
   * Visit the Break Inst syntax node
   * @param inst the syntax node
   */
  public visitBreak(_: Inst.Break): Diagnostics {
    return [];
  }

  /**
   * Visit the Switch Inst syntax node
   * @param inst the syntax node
   */
  public visitSwitch(inst: Inst.Switch): Diagnostics {
    return this.useExprLocals(inst.target).concat(
      this.resolveExpr(inst.target),
    );
  }

  /**
   * Visit the For Inst syntax node
   * @param inst the syntax node
   */
  public visitFor(inst: Inst.For): Diagnostics {
    this.tableBuilder.beginScope(inst);
    const declareError = this.tableBuilder.declareVariable(
      ScopeType.local,
      inst.identifier,
    );

    const errors = this.useExprLocals(inst.suffix).concat(
      this.resolveExpr(inst.suffix),
      this.resolveInst(inst.inst),
    );

    this.tableBuilder.endScope();

    if (!empty(declareError)) {
      return errors.concat(declareError);
    }
    return errors;
  }

  /**
   * Visit the On Inst syntax node
   * @param inst the syntax node
   */
  public visitOn(inst: Inst.On): Diagnostics {
    if (this.initialPass) {
      return this.deferNode(inst);
    }

    return this.useExprLocals(inst.suffix).concat(
      this.resolveExpr(inst.suffix),
      this.resolveInst(inst.inst),
    );
  }

  /**
   * Visit the Toggle Inst syntax node
   * @param inst the syntax node
   */
  public visitToggle(inst: Inst.Toggle): Diagnostics {
    return this.useExprLocals(inst.suffix).concat(
      this.resolveExpr(inst.suffix),
    );
  }

  /**
   * Visit the Wait Inst syntax node
   * @param inst the syntax node
   */
  public visitWait(inst: Inst.Wait): Diagnostics {
    return this.useExprLocals(inst.expr).concat(this.resolveExpr(inst.expr));
  }

  /**
   * Visit the Log Inst syntax node
   * @param inst the syntax node
   */
  public visitLog(inst: Inst.Log): Diagnostics {
    return this.useExprLocals(inst.expr).concat(
      this.resolveExpr(inst.expr),
      this.resolveExpr(inst.target),
    );
  }

  /**
   * Visit the Copy Inst syntax node
   * @param inst the syntax node
   */
  public visitCopy(inst: Inst.Copy): Diagnostics {
    return this.useExprLocals(inst.target).concat(
      createDiagnostic(
        inst,
        'Copy is deprecated as of 1.0.0',
        DiagnosticSeverity.Warning,
      ),
      this.resolveExpr(inst.target),
      this.resolveExpr(inst.destination),
    );
  }

  /**
   * Visit the Rename Inst syntax node
   * @param inst the syntax node
   */
  public visitRename(inst: Inst.Rename): Diagnostics {
    return this.useExprLocals(inst.target).concat(
      createDiagnostic(
        inst,
        'Rename is deprecated as of 1.0.0',
        DiagnosticSeverity.Warning,
      ),
      this.useExprLocals(inst.alternative),
      this.resolveExpr(inst.target),
      this.resolveExpr(inst.alternative),
    );
  }

  /**
   * Visit the Delete Inst syntax node
   * @param inst the syntax node
   */
  public visitDelete(inst: Inst.Delete): Diagnostics {
    const deprecated = createDiagnostic(
      inst,
      'Copy is deprecated as of 1.0.0',
      DiagnosticSeverity.Warning,
    );

    if (empty(inst.volume)) {
      return this.useExprLocals(inst.target).concat(
        deprecated,
        this.resolveExpr(inst.target),
      );
    }

    return this.useExprLocals(inst.target).concat(
      deprecated,
      this.useExprLocals(inst.volume),
      this.resolveExpr(inst.target),
      this.resolveExpr(inst.volume),
    );
  }

  /**
   * Visit the Run Inst syntax node
   * @param inst the syntax node
   */
  public visitRun(inst: Inst.Run): Diagnostics {
    if (empty(inst.args) && empty(inst.expr)) {
      return [];
    }

    const argError = !empty(inst.args)
      ? accumulateErrors(inst.args, this.useExprLocals.bind(this)).concat(
          accumulateErrors(inst.args, this.resolveExpr.bind(this)),
        )
      : [];

    if (empty(inst.expr)) {
      return argError;
    }

    return this.useExprLocals(inst.expr).concat(
      this.resolveExpr(inst.expr),
      argError,
    );
  }

  /**
   * Visit the RunPath Inst syntax node
   * @param inst the syntax node
   */
  public visitRunPath(inst: Inst.RunPath): Diagnostics {
    if (empty(inst.args)) {
      return this.useExprLocals(inst.expr).concat(this.resolveExpr(inst.expr));
    }

    return this.useExprLocals(inst.expr).concat(
      this.resolveExpr(inst.expr),
      accumulateErrors(inst.args, this.useExprLocals.bind(this)),
      accumulateErrors(inst.args, this.resolveExpr.bind(this)),
    );
  }

  /**
   * Visit the RunPathOnce Inst syntax node
   * @param inst the syntax node
   */
  public visitRunPathOnce(inst: Inst.RunPathOnce): Diagnostics {
    if (empty(inst.args)) {
      return this.useExprLocals(inst.expr).concat(this.resolveExpr(inst.expr));
    }

    return this.useExprLocals(inst.expr).concat(
      this.resolveExpr(inst.expr),
      accumulateErrors(inst.args, this.useExprLocals.bind(this)),
      accumulateErrors(inst.args, this.resolveExpr.bind(this)),
    );
  }

  /**
   * Visit the Compile Inst syntax node
   * @param inst the syntax node
   */
  public visitCompile(inst: Inst.Compile): Diagnostics {
    if (empty(inst.destination)) {
      return this.useExprLocals(inst.target).concat(
        this.resolveExpr(inst.target),
      );
    }

    return this.useExprLocals(inst.target).concat(
      this.useExprLocals(inst.destination),
      this.resolveExpr(inst.target),
      this.resolveExpr(inst.destination),
    );
  }

  /**
   * Visit the List Inst syntax node
   * @param inst the syntax node
   */
  public visitList(inst: Inst.List): Diagnostics {
    // list generates new variable when target is used
    if (empty(inst.target)) {
      return [];
    }

    return this.setVariable(inst.target);
  }

  /**
   * Visit the Empty Inst syntax node
   * @param inst the syntax node
   */
  public visitEmpty(_: Inst.Empty): Diagnostics {
    return [];
  }

  /**
   * Visit the Print Inst syntax node
   * @param inst the syntax node
   */
  public visitPrint(inst: Inst.Print): Diagnostics {
    return this.useExprLocals(inst.expr).concat(this.resolveExpr(inst.expr));
  }

  /**
   * Logic for settings a variable. used by set inst and list command
   * @param set token to set
   */
  private setVariable(set: IToken): Diagnostic[] {
    // if variable isn't defined either report error or define
    let defineError: Maybe<Diagnostic> = undefined;

    // if we find the symbol just set it
    if (!empty(this.tableBuilder.lookupBinding(set, ScopeType.global))) {
      defineError = this.tableBuilder.setBinding(set);

      // if we didn't find it and we're not lazy global add error
    } else if (!this.lazyGlobal) {
      defineError = createDiagnostic(
        set,
        `Attempted to set ${set.lexeme} which has not be declared. ` +
          `Either remove lazy global directive or declare ${set.lexeme}`,
        DiagnosticSeverity.Error,
      );

      // not found and lazy global so declare global
    } else {
      defineError = this.tableBuilder.declareVariable(ScopeType.global, set);
    }

    if (!empty(defineError)) {
      return [defineError];
    }

    return [];
  }

  /* --------------------------------------------

  Expressions

  ----------------------------------------------*/

  public visitExprInvalid(_: Expr.Invalid): Diagnostic[] {
    return [];
  }

  public visitBinary(expr: Expr.Binary): Diagnostic[] {
    return this.resolveExpr(expr.left).concat(this.resolveExpr(expr.right));
  }

  public visitUnary(expr: Expr.Unary): Diagnostic[] {
    return this.resolveExpr(expr.factor);
  }

  public visitFactor(expr: Expr.Factor): Diagnostic[] {
    return this.resolveExpr(expr.suffix).concat(
      this.resolveExpr(expr.exponent),
    );
  }

  public visitSuffix(expr: Expr.Suffix): Diagnostic[] {
    const atom = this.visitSuffixTerm(expr.suffixTerm);
    if (empty(expr.trailer)) {
      return atom;
    }

    return atom.concat(this.resolveSuffixTerm(expr.trailer));
  }

  public visitLambda(expr: Expr.Lambda): Diagnostic[] {
    this.tableBuilder.beginScope(expr);
    const errors = this.resolveInsts(expr.insts);
    this.tableBuilder.endScope();

    return errors;
  }

  /* --------------------------------------------

  Suffix Terms

  ----------------------------------------------*/

  public visitSuffixTermInvalid(_: SuffixTerm.Invalid): Diagnostics {
    return [];
  }

  public visitSuffixTrailer(
    suffixTerm: SuffixTerm.SuffixTrailer,
  ): Diagnostic[] {
    const atom = this.visitSuffixTerm(suffixTerm.suffixTerm);
    if (empty(suffixTerm.trailer)) {
      return atom;
    }

    return atom.concat(this.resolveSuffixTerm(suffixTerm.trailer));
  }

  public visitSuffixTerm(suffixTerm: SuffixTerm.SuffixTerm): Diagnostic[] {
    const atom = this.resolveSuffixTerm(suffixTerm.atom);
    if (suffixTerm.trailers.length === 0) {
      return atom;
    }

    return atom.concat(
      suffixTerm.trailers.reduce(
        (acc, curr) => acc.concat(this.resolveSuffixTerm(curr)),
        [] as Diagnostic[],
      ),
    );
  }

  public visitCall(suffixTerm: SuffixTerm.Call): Diagnostic[] {
    return accumulateErrors(suffixTerm.args, this.resolveExpr.bind(this));
  }

  public visitArrayIndex(_: SuffixTerm.ArrayIndex): Diagnostic[] {
    return [];
  }

  public visitArrayBracket(suffixTerm: SuffixTerm.ArrayBracket): Diagnostic[] {
    return this.resolveExpr(suffixTerm.index);
  }

  public visitDelegate(_: SuffixTerm.Delegate): Diagnostic[] {
    return [];
  }

  public visitLiteral(_: SuffixTerm.Literal): Diagnostic[] {
    return [];
  }

  public visitIdentifier(_: SuffixTerm.Identifier): Diagnostic[] {
    return [];
  }

  public visitGrouping(suffixTerm: SuffixTerm.Grouping): Diagnostic[] {
    return this.resolveExpr(suffixTerm.expr);
  }

  /**
   * Defer a node for later execution
   * @param node node to defer
   */
  private deferNode(node: IInst): Diagnostic[] {
    this.deferred.push({
      node,
      path: this.tableBuilder.getPath(),
    });

    return [];
  }
}

const accumulateErrors = <T>(
  items: T[],
  checker: (item: T) => Diagnostics,
): Diagnostics => {
  return items.reduce(
    (accumulator, item) => accumulator.concat(checker(item)),
    [] as Diagnostics,
  );
};
