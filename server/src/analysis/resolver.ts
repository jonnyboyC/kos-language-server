import {
  IInstVisitor,
  IExpr,
  IInst,
  ScopeType,
  ISuffixTerm,
  IScript,
  ISuffixTermPasser,
  IExprPasser,
  IInstPasser,
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
import { ILocalResult } from './types';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { createDiagnostic } from '../utilities/diagnosticsUtils';
import { sep } from 'path';

export type Diagnostics = Diagnostic[];

export class Resolver
  implements
    IInstVisitor<Diagnostics>,
    IInstPasser<Diagnostics>,
    IExprPasser<Diagnostics>,
    ISuffixTermPasser<Diagnostics> {
  private readonly script: Script;
  private readonly tableBuilder: SymbolTableBuilder;
  private readonly logger: ILogger;
  private readonly tracer: ITracer;
  private readonly localResolver: LocalResolver;
  private readonly setResolver: SetResolver;
  private lazyGlobal: boolean;
  private firstInst: boolean;

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
    this.lazyGlobal = true;
    this.firstInst = true;
    this.logger = logger;
    this.tracer = tracer;
  }

  // resolve the sequence of instructions
  public resolve(): Diagnostics {
    try {
      const splits = this.script.uri.split(sep);
      const file = splits[splits.length - 1];

      this.logger.info(
        `Resolving started for ${file}.`,
      );

      this.tableBuilder.rewindScope();
      this.tableBuilder.beginScope(this.script);
      const [firstInst, ...restInsts] = this.script.insts;

      // check for lazy global flag
      const firstError = this.resolveInst(firstInst);
      this.firstInst = false;

      // resolve reset
      const resolveErrors = this.resolveInsts(restInsts);
      const scopeErrors = this.tableBuilder.endScope();

      this.script.lazyGlobal = this.lazyGlobal;
      const allErrors = firstError.concat(resolveErrors, scopeErrors);

      this.logger.info(
        `Resolving finished for ${file}`
      );
      
      if (allErrors.length) {
        this.logger.warn(`Resolver encounted ${allErrors.length} errors`);
      }
      return allErrors
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
  private skipExpr(expr: IExpr): Diagnostics {
    return expr.pass(this);
  }

  /**
   * Pass through suffix term
   * @param suffixTerm suffix term to skip
   */
  private skipSuffixTerm(suffixTerm: ISuffixTerm): Diagnostics {
    return suffixTerm.pass(this);
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
    const resolveErrors = this.skipExpr(decl.value);

    return empty(declareError)
      ? useErrors.concat(resolveErrors)
      : useErrors.concat(declareError, resolveErrors);
  }

  /**
   * Pass through the declare variable synatx node
   * @param decl the syntax node
   */
  public passDeclVariable(decl: Decl.Var): Diagnostic[] {
    return this.skipExpr(decl.value);
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
    const resolveErrors = this.skipExpr(decl.value);

    return empty(declareError)
      ? useErrors.concat(resolveErrors)
      : useErrors.concat(declareError, resolveErrors);
  }

  /**
   * Pass through the declare lock syntax node
   * @param decl the syntax node
   */
  public passDeclLock(decl: Decl.Lock): Diagnostic[] {
    return this.skipExpr(decl.value);
  }

  /**
   * Visit the declare function syntax node
   * @param decl the syntax node
   */
  public visitDeclFunction(decl: Decl.Func): Diagnostic[] {
    return this.resolveInst(decl.block);
  }

  /**
   * Pass through the declare function syntax node
   * @param decl the syntax node
   */
  public passDeclFunction(decl: Decl.Func): Diagnostic[] {
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

  /**
   * Pass through the declare parameter syntax node
   * @param decl the syntax node
   */
  public passDeclParameter(decl: Decl.Param): Diagnostic[] {
    return accumulateErrors(
      decl.defaultParameters.map(parameter => parameter.value),
      this.skipExpr.bind(this),
    );
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
   * Pass through the Invalid Inst syntax node
   * @param inst the syntax node
   */
  public passInstInvalid(_: Inst.Invalid): Diagnostic[] {
    return [];
  }

  /**
   * Visit the Block Inst syntax node
   * @param inst the syntax node
   */
  public visitBlock(inst: Inst.Block): Diagnostics {
    this.tableBuilder.beginScope(inst);
    const errors = this.resolveInsts(inst.insts);
    const scopeErrors = this.tableBuilder.endScope();

    return errors.concat(scopeErrors);
  }

  /**
   * Pass through the Block Inst syntax node
   * @param inst the syntax node
   */
  public passBlock(inst: Inst.Block): Diagnostic[] {
    this.tableBuilder.beginScope(inst);
    const errors = this.resolveInsts(inst.insts);
    const scopeErrors = this.tableBuilder.endScope();

    return errors.concat(scopeErrors);
  }

  /**
   * Visit the Expr Inst syntax node
   * @param inst the syntax node
   */
  public visitExpr(inst: Inst.ExprInst): Diagnostics {
    return this.useExprLocals(inst.suffix).concat(this.skipExpr(inst.suffix));
  }

  /**
   * Pass through the Expr Inst syntax node
   * @param inst the syntax node
   */
  public passExpr(inst: Inst.ExprInst): Diagnostic[] {
    return this.skipExpr(inst.suffix);
  }

  /**
   * Visit the On Off Inst syntax node
   * @param inst the syntax node
   */
  public visitOnOff(inst: Inst.OnOff): Diagnostics {
    return this.useExprLocals(inst.suffix).concat(this.skipExpr(inst.suffix));
  }

  /**
   * Pass through the On Off Inst syntax node
   * @param inst the syntax node
   */
  public passOnOff(inst: Inst.OnOff): Diagnostic[] {
    return this.skipExpr(inst.suffix);
  }

  /**
   * Visit the Command Inst syntax node
   * @param inst the syntax node
   */
  public visitCommand(_: Inst.Command): Diagnostics {
    return [];
  }

  /**
   * Pass through the Command Inst syntax node
   * @param inst the syntax node
   */
  public passCommand(_: Inst.Command): Diagnostic[] {
    return [];
  }

  /**
   * Visit the Command Expr Inst syntax node
   * @param inst the syntax node
   */
  public visitCommandExpr(inst: Inst.CommandExpr): Diagnostics {
    return this.useExprLocals(inst.expr).concat(this.skipExpr(inst.expr));
  }

  /**
   * Pass through the Command Expr Inst syntax node
   * @param inst the syntax node
   */
  public passCommandExpr(inst: Inst.CommandExpr): Diagnostic[] {
    return this.skipExpr(inst.expr);
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
   * Pass through the Unset Inst syntax node
   * @param inst the syntax node
   */
  public passUnset(_: Inst.Unset): Diagnostic[] {
    return [];
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
   * Pass through the Unlock Inst syntax node
   * @param inst the syntax node
   */
  public passUnlock(_: Inst.Unlock): Diagnostic[] {
    return [];
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

    const useErrors = this.useExprLocals(inst.value).concat(
      this.useTokens(used),
    );
    const resolveErrors = this.skipExpr(inst.value);

    return !empty(defineError)
      ? useErrors.concat(resolveErrors, defineError)
      : useErrors.concat(resolveErrors);
  }

  /**
   * Pass through the Unlock Inst syntax node
   * @param inst the syntax node
   */
  public passSet(inst: Inst.Set): Diagnostic[] {
    return this.skipExpr(inst.suffix).concat(this.skipExpr(inst.value));
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
   * Pass Through the Lazy Global Inst syntax node
   * @param inst the syntax node
   */
  public passLazyGlobal(_: Inst.LazyGlobal): Diagnostic[] {
    return [];
  }

  /**
   * Visit the If Inst syntax node
   * @param inst the syntax node
   */
  public visitIf(inst: Inst.If): Diagnostics {
    const errors = this.useExprLocals(inst.condition).concat(
      this.skipExpr(inst.condition),
      this.resolveInst(inst.ifInst),
    );

    if (inst.elseInst) {
      return errors.concat(this.resolveInst(inst.elseInst));
    }

    return errors;
  }

  /**
   * Pass Through the If Inst syntax node
   * @param inst the syntax node
   */
  public passIf(inst: Inst.If): Diagnostic[] {
    const errors = this.skipExpr(inst.condition).concat(
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
   * Pass Through the Else Inst syntax node
   * @param inst the syntax node
   */
  public passElse(inst: Inst.Else): Diagnostic[] {
    return this.resolveInst(inst.inst);
  }

  /**
   * Visit the When Inst syntax node
   * @param inst the syntax node
   */
  public visitUntil(inst: Inst.Until): Diagnostics {
    return this.useExprLocals(inst.condition).concat(
      this.skipExpr(inst.condition),
      this.resolveInst(inst.inst),
    );
  }

  /**
   * Pass Through the When Inst syntax node
   * @param inst the syntax node
   */
  public passUntil(inst: Inst.Until): Diagnostic[] {
    return this.skipExpr(inst.condition).concat(this.resolveInst(inst.inst));
  }

  /**
   * Visit the From Inst syntax node
   * @param inst the syntax node
   */
  public visitFrom(inst: Inst.From): Diagnostics {
    this.tableBuilder.beginScope(inst);

    const resolverErrors = this.resolveInsts(inst.initializer.insts).concat(
      this.skipExpr(inst.condition),
      this.resolveInsts(inst.increment.insts),
      this.resolveInst(inst.inst),
    );

    const useErrors = this.useExprLocals(inst.condition);
    const scopeErrors = this.tableBuilder.endScope();

    return resolverErrors.concat(useErrors, scopeErrors);
  }

  /**
   * Pass Through the From Inst syntax node
   * @param inst the syntax node
   */
  public passFrom(inst: Inst.From): Diagnostic[] {
    this.tableBuilder.beginScope(inst);

    const resolverErrors = this.resolveInsts(inst.initializer.insts).concat(
      this.skipExpr(inst.condition),
      this.resolveInsts(inst.increment.insts),
      this.resolveInst(inst.inst),
    );

    const scopeErrors = this.tableBuilder.endScope();

    return resolverErrors.concat(scopeErrors);
  }

  /**
   * Visit the When Inst syntax node
   * @param inst the syntax node
   */
  public visitWhen(inst: Inst.When): Diagnostics {
    return this.useExprLocals(inst.condition).concat(
      this.skipExpr(inst.condition),
      this.resolveInst(inst.inst),
    );
  }

  /**
   * Pass Through the When Inst syntax node
   * @param inst the syntax node
   */
  public passWhen(inst: Inst.When): Diagnostic[] {
    return this.skipExpr(inst.condition).concat(this.resolveInst(inst.inst));
  }

  /**
   * Visit the Return Inst syntax node
   * @param inst the syntax node
   */
  public visitReturn(inst: Inst.Return): Diagnostics {
    if (inst.expr) {
      return this.useExprLocals(inst.expr).concat(this.skipExpr(inst.expr));
    }

    return [];
  }

  /**
   * Pass Through the Return Inst syntax node
   * @param inst the syntax node
   */
  public passReturn(inst: Inst.Return): Diagnostic[] {
    return !empty(inst.expr) ? this.skipExpr(inst.expr) : [];
  }

  /**
   * Visit the Break Inst syntax node
   * @param inst the syntax node
   */
  public visitBreak(_: Inst.Break): Diagnostics {
    return [];
  }

  /**
   * Pass Through the Break Inst syntax node
   * @param inst the syntax node
   */
  public passBreak(_: Inst.Break): Diagnostic[] {
    return [];
  }

  /**
   * Visit the Switch Inst syntax node
   * @param inst the syntax node
   */
  public visitSwitch(inst: Inst.Switch): Diagnostics {
    return this.useExprLocals(inst.target).concat(this.skipExpr(inst.target));
  }

  /**
   * Pass Through the Switch Inst syntax node
   * @param inst the syntax node
   */
  public passSwitch(inst: Inst.Switch): Diagnostic[] {
    return this.skipExpr(inst.target);
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
      this.skipExpr(inst.suffix),
      this.resolveInst(inst.inst),
      this.tableBuilder.endScope(),
    );

    if (!empty(declareError)) {
      return errors.concat(declareError);
    }
    return errors;
  }

  /**
   * Pass Through the For Inst syntax node
   * @param inst the syntax node
   */
  public passFor(inst: Inst.For): Diagnostic[] {
    this.tableBuilder.beginScope(inst);

    return this.skipExpr(inst.suffix).concat(
      this.resolveInst(inst.inst),
      this.tableBuilder.endScope(),
    );
  }

  /**
   * Visit the On Inst syntax node
   * @param inst the syntax node
   */
  public visitOn(inst: Inst.On): Diagnostics {
    return this.useExprLocals(inst.suffix).concat(
      this.skipExpr(inst.suffix),
      this.resolveInst(inst.inst),
    );
  }

  /**
   * Pass Through the On Inst syntax node
   * @param inst the syntax node
   */
  public passOn(inst: Inst.On): Diagnostic[] {
    return this.skipExpr(inst.suffix).concat(this.resolveInst(inst.inst));
  }

  /**
   * Visit the Toggle Inst syntax node
   * @param inst the syntax node
   */
  public visitToggle(inst: Inst.Toggle): Diagnostics {
    return this.useExprLocals(inst.suffix).concat(this.skipExpr(inst.suffix));
  }

  /**
   * Pass Through the Toggle Inst syntax node
   * @param inst the syntax node
   */
  public passToggle(inst: Inst.Toggle): Diagnostic[] {
    return this.skipExpr(inst.suffix);
  }

  /**
   * Visit the Wait Inst syntax node
   * @param inst the syntax node
   */
  public visitWait(inst: Inst.Wait): Diagnostics {
    return this.useExprLocals(inst.expr).concat(this.skipExpr(inst.expr));
  }

  /**
   * Pass Through the Wait Inst syntax node
   * @param inst the syntax node
   */
  public passWait(inst: Inst.Wait): Diagnostic[] {
    return this.skipExpr(inst.expr);
  }

  /**
   * Visit the Log Inst syntax node
   * @param inst the syntax node
   */
  public visitLog(inst: Inst.Log): Diagnostics {
    return this.useExprLocals(inst.expr).concat(
      this.skipExpr(inst.expr),
      this.skipExpr(inst.target),
    );
  }

  /**
   * Pass Through the Log Inst syntax node
   * @param inst the syntax node
   */
  public passLog(inst: Inst.Log): Diagnostic[] {
    return this.skipExpr(inst.expr).concat(this.skipExpr(inst.target));
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
      this.skipExpr(inst.target),
      this.skipExpr(inst.destination),
    );
  }

  /**
   * Pass Through the Copy Inst syntax node
   * @param inst the syntax node
   */
  public passCopy(inst: Inst.Copy): Diagnostic[] {
    return this.skipExpr(inst.target).concat(this.skipExpr(inst.destination));
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
      this.skipExpr(inst.target),
      this.skipExpr(inst.alternative),
    );
  }

  /**
   * Pass Through the Rename Inst syntax node
   * @param inst the syntax node
   */
  public passRename(inst: Inst.Rename): Diagnostic[] {
    return this.skipExpr(inst.target).concat(this.skipExpr(inst.alternative));
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
        this.skipExpr(inst.target),
      );
    }

    return this.useExprLocals(inst.target).concat(
      deprecated,
      this.useExprLocals(inst.volume),
      this.skipExpr(inst.target),
      this.skipExpr(inst.volume),
    );
  }

  /**
   * Pass Through the Delete Inst syntax node
   * @param inst the syntax node
   */
  public passDelete(inst: Inst.Delete): Diagnostic[] {
    if (empty(inst.volume)) {
      return this.skipExpr(inst.target);
    }

    return this.skipExpr(inst.target).concat(this.skipExpr(inst.volume));
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
          accumulateErrors(inst.args, this.skipExpr.bind(this)),
        )
      : [];

    if (empty(inst.expr)) {
      return argError;
    }

    return this.useExprLocals(inst.expr).concat(
      this.skipExpr(inst.expr),
      argError,
    );
  }

  /**
   * Pass Through the Run Inst syntax node
   * @param inst the syntax node
   */
  public passRun(inst: Inst.Run): Diagnostic[] {
    if (empty(inst.args) && empty(inst.expr)) {
      return [];
    }

    const argError = !empty(inst.args)
      ? accumulateErrors(inst.args, this.skipExpr.bind(this))
      : [];

    if (empty(inst.expr)) {
      return argError;
    }

    return argError.concat(this.skipExpr(inst.expr));
  }

  /**
   * Visit the RunPath Inst syntax node
   * @param inst the syntax node
   */
  public visitRunPath(inst: Inst.RunPath): Diagnostics {
    if (empty(inst.args)) {
      return this.useExprLocals(inst.expr).concat(this.skipExpr(inst.expr));
    }

    return this.useExprLocals(inst.expr).concat(
      this.skipExpr(inst.expr),
      accumulateErrors(inst.args, this.useExprLocals.bind(this)),
      accumulateErrors(inst.args, this.skipExpr.bind(this)),
    );
  }

  /**
   * Pass Through the RunPath Inst syntax node
   * @param inst the syntax node
   */
  public passRunPath(inst: Inst.RunPath): Diagnostic[] {
    if (empty(inst.args)) {
      return this.skipExpr(inst.expr);
    }

    return this.skipExpr(inst.expr).concat(
      accumulateErrors(inst.args, this.skipExpr.bind(this)),
    );
  }

  /**
   * Visit the RunPathOnce Inst syntax node
   * @param inst the syntax node
   */
  public visitRunPathOnce(inst: Inst.RunPathOnce): Diagnostics {
    if (empty(inst.args)) {
      return this.useExprLocals(inst.expr).concat(this.skipExpr(inst.expr));
    }

    return this.useExprLocals(inst.expr).concat(
      this.skipExpr(inst.expr),
      accumulateErrors(inst.args, this.useExprLocals.bind(this)),
      accumulateErrors(inst.args, this.skipExpr.bind(this)),
    );
  }

  /**
   * Pass Through the RunPathOnce Inst syntax node
   * @param inst the syntax node
   */
  public passRunPathOnce(inst: Inst.RunPathOnce): Diagnostic[] {
    if (empty(inst.args)) {
      return this.skipExpr(inst.expr);
    }

    return this.skipExpr(inst.expr).concat(
      accumulateErrors(inst.args, this.skipExpr.bind(this)),
    );
  }

  /**
   * Visit the Compile Inst syntax node
   * @param inst the syntax node
   */
  public visitCompile(inst: Inst.Compile): Diagnostics {
    if (empty(inst.destination)) {
      return this.useExprLocals(inst.target).concat(this.skipExpr(inst.target));
    }

    return this.useExprLocals(inst.target).concat(
      this.useExprLocals(inst.destination),
      this.skipExpr(inst.target),
      this.skipExpr(inst.destination),
    );
  }

  /**
   * Pass Through the Compile Inst syntax node
   * @param inst the syntax node
   */
  public passCompile(inst: Inst.Compile): Diagnostic[] {
    if (empty(inst.destination)) {
      return this.skipExpr(inst.target);
    }

    return this.skipExpr(inst.target).concat(this.skipExpr(inst.destination));
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

    const declareError = this.tableBuilder.declareVariable(
      ScopeType.local,
      inst.target,
    );
    return !empty(declareError) ? [declareError] : [];
  }

  /**
   * Pass Through the List Inst syntax node
   * @param inst the syntax node
   */
  public passList(_: Inst.List): Diagnostic[] {
    return [];
  }

  /**
   * Visit the Empty Inst syntax node
   * @param inst the syntax node
   */
  public visitEmpty(_: Inst.Empty): Diagnostics {
    return [];
  }

  /**
   * Pass Through the Empty Inst syntax node
   * @param inst the syntax node
   */
  public passEmpty(_: Inst.Empty): Diagnostic[] {
    return [];
  }

  /**
   * Visit the Print Inst syntax node
   * @param inst the syntax node
   */
  public visitPrint(inst: Inst.Print): Diagnostics {
    return this.useExprLocals(inst.expr).concat(this.skipExpr(inst.expr));
  }

  /**
   * Pass Through the Print Inst syntax node
   * @param inst the syntax node
   */
  public passPrint(inst: Inst.Print): Diagnostic[] {
    return this.skipExpr(inst.expr);
  }

  /* --------------------------------------------

  Expressions

  ----------------------------------------------*/

  public passExprInvalid(_: Expr.Invalid): Diagnostic[] {
    return [];
  }

  public passBinary(expr: Expr.Binary): Diagnostic[] {
    return this.skipExpr(expr.left).concat(this.skipExpr(expr.right));
  }

  public passUnary(expr: Expr.Unary): Diagnostic[] {
    return this.skipExpr(expr.factor);
  }

  public passFactor(expr: Expr.Factor): Diagnostic[] {
    return this.skipExpr(expr.suffix).concat(this.skipExpr(expr.exponent));
  }

  public passSuffix(expr: Expr.Suffix): Diagnostic[] {
    const atom = this.passSuffixTerm(expr.suffixTerm);
    if (empty(expr.trailer)) {
      return atom;
    }

    return atom.concat(this.skipSuffixTerm(expr.trailer));
  }

  public passAnonymousFunction(expr: Expr.AnonymousFunction): Diagnostic[] {
    this.tableBuilder.beginScope(expr);
    const errors = this.resolveInsts(expr.insts);
    const scopeErrors = this.tableBuilder.endScope();

    return errors.concat(scopeErrors);
  }

  /* --------------------------------------------

  Suffix Terms

  ----------------------------------------------*/

  public passSuffixTermInvalid(_: SuffixTerm.Invalid): Diagnostics {
    return [];
  }

  public passSuffixTrailer(suffixTerm: SuffixTerm.SuffixTrailer): Diagnostic[] {
    const atom = this.passSuffixTerm(suffixTerm.suffixTerm);
    if (empty(suffixTerm.trailer)) {
      return atom;
    }

    return atom.concat(this.skipSuffixTerm(suffixTerm.trailer));
  }

  public passSuffixTerm(suffixTerm: SuffixTerm.SuffixTerm): Diagnostic[] {
    const atom = this.skipSuffixTerm(suffixTerm.atom);
    if (suffixTerm.trailers.length === 0) {
      return atom;
    }

    return atom.concat(
      suffixTerm.trailers.reduce(
        (acc, curr) => acc.concat(this.skipSuffixTerm(curr)),
        [] as Diagnostic[],
      ),
    );
  }

  public passCall(suffixTerm: SuffixTerm.Call): Diagnostic[] {
    return accumulateErrors(suffixTerm.args, this.skipExpr.bind(this));
  }

  public passArrayIndex(_: SuffixTerm.ArrayIndex): Diagnostic[] {
    return [];
  }

  public passArrayBracket(suffixTerm: SuffixTerm.ArrayBracket): Diagnostic[] {
    return this.skipExpr(suffixTerm.index);
  }

  public passDelegate(_: SuffixTerm.Delegate): Diagnostic[] {
    return [];
  }

  public passLiteral(_: SuffixTerm.Literal): Diagnostic[] {
    return [];
  }

  public passIdentifier(_: SuffixTerm.Identifier): Diagnostic[] {
    return [];
  }

  public passGrouping(suffixTerm: SuffixTerm.Grouping): Diagnostic[] {
    return this.skipExpr(suffixTerm.expr);
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
