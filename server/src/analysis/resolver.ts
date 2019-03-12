import {
  IInstVisitor, IExpr,
  IInst, ScopeType, ISuffixTerm,
  IScript,
  ISuffixTermPasser,
  IExprPasser,
  IInstPasser,
} from '../parser/types';
import * as SuffixTerm from '../parser/suffixTerm';
import * as Expr from '../parser/expr';
import * as Inst from '../parser/inst';
import * as Decl from '../parser/declare';
import { ResolverError } from './resolverError';
import { empty } from '../utilities/typeGuards';
import { LocalResolver } from './localResolver';
import { SetResolver } from './setResolver';
import { TokenType } from '../entities/tokentypes';
import { Script } from '../entities/script';
import { mockLogger, mockTracer } from '../utilities/logger';
import { SymbolTableBuilder } from './symbolTableBuilder';
import { ILocalResult, IResolverError } from './types';

export type Errors = IResolverError[];

export class Resolver implements
  IInstVisitor<Errors>,
  IInstPasser<Errors>,
  IExprPasser<Errors>,
  ISuffixTermPasser<Errors> {

  private readonly script: Script;
  private readonly scopeBuilder: SymbolTableBuilder;
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
    tracer: ITracer = mockTracer) {

    this.script = script;
    this.scopeBuilder = symbolTableBuilder;
    this.localResolver = new LocalResolver();
    this.setResolver = new SetResolver(this.localResolver);
    this.lazyGlobal = true;
    this.firstInst = true;
    this.logger = logger;
    this.tracer = tracer;
  }

  // resolve the sequence of instructions
  public resolve(): Errors {
    try {
      this.scopeBuilder.rewindScope();
      this.scopeBuilder.beginScope(this.script);
      const [firstInst, ...restInsts] = this.script.insts;

      // check for lazy global flag
      const firstError = this.resolveInst(firstInst);
      this.firstInst = false;

      // resolve reset
      const resolveErrors = this.resolveInsts(restInsts);
      const scopeErrors = this.scopeBuilder.endScope();

      this.script.lazyGlobal = this.lazyGlobal;
      return firstError.concat(resolveErrors, scopeErrors);
    } catch (err) {
      this.logger.error(`Error occured in resolver ${err}`);
      this.tracer.log(err);

      return [];
    }
  }

  // resolve the given set of instructions
  private resolveInsts(insts: IInst[]): Errors {
    return accumulateErrors(insts, this.resolveInst.bind(this));
  }

  // resolve for an instruction
  private resolveInst(inst: IInst): Errors {
    return inst.accept(this);
  }

  // resolve for an expression
  private resolveExpr(expr: IExpr): Errors {
    return expr.pass(this);
  }

  // resolve for an expression
  private resolveSuffixTerm(suffixTerm: ISuffixTerm): Errors {
    return suffixTerm.pass(this);
  }

  // attempt to use ever variable in the expression
  private useExprLocals(expr: IExpr): Errors {
    return this.useTokens(this.localResolver.resolveExpr(expr));
  }

  // attempt to use ever variable in the expression
  private useTokens(results: ILocalResult[]): Errors {
    return results
      .map(({ token, expr }) => this.scopeBuilder.useSymbol(token, expr))
      .filter(this.filterError);
  }

  // filter to just actual errors
  private filterError(maybeError: Maybe<ResolverError>): maybeError is ResolverError {
    return !empty(maybeError);
  }

  /* --------------------------------------------

  Declarations

  ----------------------------------------------*/


  public passUntil(inst: Inst.Until): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passFrom(inst: Inst.From): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passWhen(inst: Inst.When): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passReturn(inst: Inst.Return): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passBreak(inst: Inst.Break): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passSwitch(inst: Inst.Switch): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passFor(inst: Inst.For): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passOn(inst: Inst.On): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passToggle(inst: Inst.Toggle): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passWait(inst: Inst.Wait): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passLog(inst: Inst.Log): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passCopy(inst: Inst.Copy): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passRename(inst: Inst.Rename): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passDelete(inst: Inst.Delete): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passRun(inst: Inst.Run): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passRunPath(inst: Inst.RunPath): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passRunPathOnce(inst: Inst.RunPathOnce): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passCompile(inst: Inst.Compile): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passList(inst: Inst.List): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passEmpty(inst: Inst.Empty): IResolverError[] {
    throw new Error('Method not implemented.');
  }
  public passPrint(inst: Inst.Print): IResolverError[] {
    throw new Error('Method not implemented.');
  }

  /**
   * Visit the declare variable syntax node
   * @param decl the syntax node
   */
  public visitDeclVariable(decl: Decl.Var): Errors {

    // determine scope type
    const scopeType = !empty(decl.scope)
      ? decl.scope.type
      : ScopeType.global;

    const declareError = this.scopeBuilder.declareVariable(scopeType, decl.identifier);
    const useErrors = this.useExprLocals(decl.value);
    const resolveErrors = this.resolveExpr(decl.value);

    return empty(declareError)
      ? useErrors.concat(resolveErrors)
      : useErrors.concat(declareError, resolveErrors);
  }

  /**
   * Pass through the declare variable synatx node
   * @param decl the syntax node
   */
  public passDeclVariable(decl: Decl.Var): IResolverError[] {
    return this.resolveExpr(decl.value);
  }

  /**
   * Visit the declare lock syntax node
   * @param decl the syntax node
   */
  public visitDeclLock(decl: Decl.Lock): ResolverError[] {

    // determine scope type
    const scopeType = !empty(decl.scope)
      ? decl.scope.type
      : ScopeType.global;

    const lookup = this.scopeBuilder.lookupLock(decl.identifier, ScopeType.global);
    let declareError: Maybe<ResolverError> = undefined;

    if (empty(lookup)) {
      declareError = this.scopeBuilder.declareLock(scopeType, decl.identifier);
    }

    const useErrors = this.useExprLocals(decl.value);
    const resolveErrors = this.resolveExpr(decl.value);

    return empty(declareError)
      ? useErrors.concat(resolveErrors)
      : useErrors.concat(declareError, resolveErrors);
  }

  /**
   * Pass through the declare lock syntax node
   * @param decl the syntax node
   */
  public passDeclLock(decl: Decl.Lock): IResolverError[] {
    return this.resolveExpr(decl.value);
  }

  /**
   * Visit the declare function syntax node
   * @param decl the syntax node
   */
  public visitDeclFunction(decl: Decl.Func): ResolverError[] {
    return this.resolveInst(decl.block);
  }

  /**
   * Pass through the declare function syntax node
   * @param decl the syntax node
   */
  public passDeclFunction(decl: Decl.Func): IResolverError[] {
    return this.resolveInst(decl.block);
  }

  /**
   * Visit the declare parameter syntax node
   * @param decl the syntax node
   */
  public visitDeclParameter(decl: Decl.Param): ResolverError[] {
    const scopeError: Maybe<ResolverError>[] = [];

    // check that parameter isn't declared global
    if (!empty(decl.scope) && !empty(decl.scope.scope)) {
      if (decl.scope.scope.type === TokenType.global) {
        scopeError.push(new ResolverError(decl.scope.scope, 'Parameters cannot be global', []));
      }
    }

    // all parameters are local
    const scopeType = ScopeType.local;

    // need to check if default paraemter can really be abbitrary expr
    const parameterErrors = decl.parameters
      .map(parameter => this.scopeBuilder.declareParameter(scopeType, parameter.identifier, false));
    const defaultParameterErrors = decl.defaultParameters
      .map(parameter => this.scopeBuilder.declareParameter(scopeType, parameter.identifier, true));
    const defaultUseErrors = decl.defaultParameters
      .map(parameter => this.useExprLocals(parameter.value));

    return scopeError.concat(parameterErrors, defaultParameterErrors, ...defaultUseErrors)
      .filter(this.filterError);
  }

  /**
   * Pass through the declare parameter syntax node
   * @param decl the syntax node
   */
  public passDeclParameter(decl: Decl.Param): IResolverError[] {
    return accumulateErrors(
      decl.defaultParameters.map(parameter => parameter.value),
      this.resolveExpr.bind(this));
  }

  /* --------------------------------------------

  Instructions

  ----------------------------------------------*/

  /**
   * Visit the Invalid Inst syntax node
   * @param decl the syntax node
   */
  public visitInstInvalid(_: Inst.Invalid): Errors {
    return [];
  }

  /**
   * Pass through the Invalid Inst syntax node
   * @param decl the syntax node
   */
  public passInstInvalid(_: Inst.Invalid): IResolverError[] {
    return [];
  }

  /**
   * Visit the Block Inst syntax node
   * @param decl the syntax node
   */
  public visitBlock(inst: Inst.Block): Errors {
    this.scopeBuilder.beginScope(inst);
    const errors = this.resolveInsts(inst.insts);
    this.scopeBuilder.endScope();

    return errors;
  }

  /**
   * Pass through the Block Inst syntax node
   * @param decl the syntax node
   */
  public passBlock(inst: Inst.Block): IResolverError[] {
    this.scopeBuilder.beginScope(inst);
    const errors = this.resolveInsts(inst.insts);
    this.scopeBuilder.endScope();

    return errors;
  }

  /**
   * Visit the Expr Inst syntax node
   * @param decl the syntax node
   */
  public visitExpr(inst: Inst.ExprInst): Errors {
    return this.useExprLocals(inst.suffix).concat(
      this.resolveExpr(inst.suffix));
  }

  /**
   * Pass through the Expr Inst syntax node
   * @param decl the syntax node
   */
  public passExpr(inst: Inst.ExprInst): IResolverError[] {
    return this.resolveExpr(inst.suffix);
  }

  /**
   * Visit the On Off Inst syntax node
   * @param decl the syntax node
   */
  public visitOnOff(inst: Inst.OnOff): Errors {
    return this.useExprLocals(inst.suffix)
      .concat(this.resolveExpr(inst.suffix));
  }

  /**
   * Pass through the On Off Inst syntax node
   * @param decl the syntax node
   */
  public passOnOff(inst: Inst.OnOff): IResolverError[] {
    return this.resolveExpr(inst.suffix);
  }

  /**
   * Visit the Command Inst syntax node
   * @param decl the syntax node
   */
  public visitCommand(_: Inst.Command): Errors {
    return [];
  }

  /**
   * Pass through the Command Inst syntax node
   * @param decl the syntax node
   */
  public passCommand(_: Inst.Command): IResolverError[] {
    return [];
  }

  /**
   * Visit the Command Expr Inst syntax node
   * @param decl the syntax node
   */
  public visitCommandExpr(inst: Inst.CommandExpr): Errors {
    return this.useExprLocals(inst.expr).concat(
      this.resolveExpr(inst.expr));
  }

  /**
   * Pass through the Command Expr Inst syntax node
   * @param decl the syntax node
   */
  public passCommandExpr(inst: Inst.CommandExpr): IResolverError[] {
    return this.resolveExpr(inst.expr);
  }

  /**
   * Visit the Unset Inst syntax node
   * @param decl the syntax node
   */
  public visitUnset(inst: Inst.Unset): Errors {
    const error = this.scopeBuilder.useVariable(inst.identifier);
    return empty(error) ? [] : [error];
  }

  /**
   * Pass through the Unset Inst syntax node
   * @param decl the syntax node
   */
  public passUnset(_: Inst.Unset): IResolverError[] {
    return [];
  }

  /**
   * Visit the Unlock Inst syntax node
   * @param decl the syntax node
   */
  public visitUnlock(inst: Inst.Unlock): Errors {
    const error = this.scopeBuilder.useLock(inst.identifier);
    return empty(error) ? [] : [error];
  }

  /**
   * Pass through the Unlock Inst syntax node
   * @param decl the syntax node
   */
  public passUnlock(_: Inst.Unlock): IResolverError[] {
    return [];
  }

  /**
   * Visit the Set Inst syntax node
   * @param decl the syntax node
   */
  public visitSet(inst: Inst.Set): Errors {
    const { set, used } = this.setResolver.resolveExpr(inst.suffix);

    // check if a set target exists
    if (empty(set)) {
      const [{ token }] = this.localResolver.resolveExpr(inst.suffix);
      return [new ResolverError(token, `cannot assign to variable ${token.lexeme}`, [])];
    }

    // if variable isn't define either report error or define
    let defineError: Maybe<ResolverError> = undefined;
    if (empty(this.scopeBuilder.lookupVariable(set, ScopeType.global))) {
      if (!this.lazyGlobal) {
        defineError = new ResolverError(
          set,
          `Attempted to set ${set.lexeme} which has not be declared.` +
          `Either remove lazy global directive or declare ${set.lexeme}`,
          []);
      } else {
        this.scopeBuilder.declareVariable(ScopeType.global, set);
      }
    }

    const useErrors = this.useExprLocals(inst.value).concat(this.useTokens(used));
    const resolveErrors = this.resolveExpr(inst.value);

    return !empty(defineError)
      ? useErrors.concat(resolveErrors, defineError)
      : useErrors.concat(resolveErrors);
  }

  /**
   * Pass through the Unlock Inst syntax node
   * @param decl the syntax node
   */
  public passSet(inst: Inst.Set): IResolverError[] {
    return this.resolveExpr(inst.suffix)
      .concat(this.resolveExpr(inst.value));
  }

  /**
   * Visit the Lazy Global Inst syntax node
   * @param decl the syntax node
   */
  public visitLazyGlobal(inst: Inst.LazyGlobal): Errors {
    // It is an error if lazy global is not at the start of a file
    if (!this.firstInst) {
      return [
        new ResolverError(inst.lazyGlobal, 'Lazy global was not declared at top of the file', []),
      ];
    }

    this.lazyGlobal = inst.onOff.type === TokenType.on;
    return [];
  }

  /**
   * Pass Through the Lazy Global Inst syntax node
   * @param decl the syntax node
   */
  public passLazyGlobal(_: Inst.LazyGlobal): IResolverError[] {
    return [];
  }

  /**
   * Visit the If Inst syntax node
   * @param decl the syntax node
   */
  public visitIf(inst: Inst.If): Errors {
    const errors = this.useExprLocals(inst.condition).concat(
      this.resolveExpr(inst.condition),
      this.resolveInst(inst.ifInst));

    if (inst.elseInst) {
      return errors.concat(
        this.resolveInst(inst.elseInst));
    }

    return errors;
  }

  /**
   * Pass Through the If Inst syntax node
   * @param decl the syntax node
   */
  public passIf(inst: Inst.If): IResolverError[] {
    const errors = this.resolveExpr(inst.condition)
      .concat(this.resolveInst(inst.ifInst));

    if (inst.elseInst) {
      return errors.concat(
        this.resolveInst(inst.elseInst));
    }

    return errors;
  }

  /**
   * Visit the Else Inst syntax node
   * @param decl the syntax node
   */
  public visitElse(inst: Inst.Else): Errors {
    return this.resolveInst(inst.inst);
  }

  /**
   * Pass Through the Else Inst syntax node
   * @param decl the syntax node
   */
  public passElse(inst: Inst.Else): IResolverError[] {
    return this.resolveInst(inst.inst);
  }

  public visitUntil(inst: Inst.Until): Errors {
    return this.useExprLocals(inst.condition).concat(
      this.resolveExpr(inst.condition),
      this.resolveInst(inst.inst));
  }

  public visitFrom(inst: Inst.From): Errors {
    this.scopeBuilder.beginScope(inst);

    const resolverErrors = this.resolveInsts(inst.initializer.insts).concat(
      this.resolveExpr(inst.condition),
      this.resolveInsts(inst.increment.insts),
      this.resolveInst(inst.inst));

    const useErrors = this.useExprLocals(inst.condition);
    const scopeErrors = this.scopeBuilder.endScope();

    return resolverErrors.concat(useErrors, scopeErrors);
  }

  public visitWhen(inst: Inst.When): Errors {
    return this.useExprLocals(inst.condition).concat(
      this.resolveExpr(inst.condition),
      this.resolveInst(inst.inst));
  }

  public visitReturn(inst: Inst.Return): Errors {
    if (inst.expr) {
      return this.useExprLocals(inst.expr)
        .concat(this.resolveExpr(inst.expr));
    }

    return [];
  }

  public visitBreak(_: Inst.Break): Errors {
    return [];
  }

  public visitSwitch(inst: Inst.Switch): Errors {
    return this.useExprLocals(inst.target)
      .concat(this.resolveExpr(inst.target));
  }

  public visitFor(inst: Inst.For): Errors {
    this.scopeBuilder.beginScope(inst);
    const declareError = this.scopeBuilder.declareVariable(ScopeType.local, inst.identifier);

    let errors = this.useExprLocals(inst.suffix).concat(
      this.resolveExpr(inst.suffix),
      this.resolveInst(inst.inst));

    errors = errors.concat(this.scopeBuilder.endScope());
    if (!empty(declareError)) {
      return errors.concat(declareError);
    }
    return errors;
  }

  public visitOn(inst: Inst.On): Errors {
    return this.useExprLocals(inst.suffix).concat(
      this.resolveExpr(inst.suffix),
      this.resolveInst(inst.inst));
  }

  public visitToggle(inst: Inst.Toggle): Errors {
    return this.useExprLocals(inst.suffix)
      .concat(this.resolveExpr(inst.suffix));
  }

  public visitWait(inst: Inst.Wait): Errors {
    return this.useExprLocals(inst.expr)
      .concat(this.resolveExpr(inst.expr));
  }

  public visitLog(inst: Inst.Log): Errors {
    return this.useExprLocals(inst.expr).concat(
      this.resolveExpr(inst.expr),
      this.resolveExpr(inst.target));
  }

  public visitCopy(inst: Inst.Copy): Errors {
    return this.useExprLocals(inst.target).concat(
      this.resolveExpr(inst.target),
      this.resolveExpr(inst.destination));
  }

  public visitRename(inst: Inst.Rename): Errors {

    // check target expression if path exists
    // if (inst.target instanceof SuffixTerm.Literal) {
    //   const path = this.pathResolver.resolveUri(
    //     inst.target.toLocation(this.script.uri),
    //     ioPath(inst));

    //   if (!empty(path) && !existsSync(path.path)) {
    //     pathErrors.push(new ResolverError(
    //       inst.target.token, `Path ${path} does not exist`, []));
    //   }
    // }

    return this.useExprLocals(inst.target).concat(
      this.useExprLocals(inst.alternative),
      this.resolveExpr(inst.target),
      this.resolveExpr(inst.alternative));
  }

  public visitDelete(inst: Inst.Delete): Errors {
    if (empty(inst.volume)) {
      return this.useExprLocals(inst.target).concat(
        this.resolveExpr(inst.target));
    }

    return this.useExprLocals(inst.target).concat(
      this.useExprLocals(inst.volume),
      this.resolveExpr(inst.target),
      this.resolveExpr(inst.volume));
  }

  public visitRun(inst: Inst.Run): Errors {
    if (empty(inst.args)) {
      return [];
    }

    const argError = accumulateErrors(inst.args, this.useExprLocals.bind(this)).concat(
      accumulateErrors(inst.args, this.resolveExpr.bind(this)));

    if (empty(inst.expr)) {
      return argError;
    }

    return this.useExprLocals(inst.expr).concat(
      this.resolveExpr(inst.expr),
      argError);
  }

  public visitRunPath(inst: Inst.RunPath): Errors {
    if (empty(inst.args)) {
      return this.useExprLocals(inst.expr)
        .concat(this.resolveExpr(inst.expr));
    }

    return this.useExprLocals(inst.expr).concat(
      this.resolveExpr(inst.expr),
      accumulateErrors(inst.args, this.useExprLocals.bind(this)),
      accumulateErrors(inst.args, this.resolveExpr.bind(this)));
  }

  public visitRunPathOnce(inst: Inst.RunPathOnce): Errors {
    if (empty(inst.args)) {
      return this.useExprLocals(inst.expr)
        .concat(this.resolveExpr(inst.expr));
    }

    return this.useExprLocals(inst.expr).concat(
      this.resolveExpr(inst.expr),
      accumulateErrors(inst.args, this.useExprLocals.bind(this)),
      accumulateErrors(inst.args, this.resolveExpr.bind(this)));
  }

  public visitCompile(inst: Inst.Compile): Errors {
    if (empty(inst.target)) {
      return this.useExprLocals(inst.expr)
        .concat(this.resolveExpr(inst.expr));
    }

    return this.useExprLocals(inst.expr).concat(
      this.useExprLocals(inst.target),
      this.resolveExpr(inst.expr),
      this.resolveExpr(inst.target));
  }

  public visitList(inst: Inst.List): Errors {
    // list generates new variable when target is used
    if (empty(inst.target)) {
      return [];
    }

    const declareError = this.scopeBuilder.declareVariable(ScopeType.local, inst.target);
    return !empty(declareError) ? [declareError] : [];
  }

  public visitEmpty(_: Inst.Empty): Errors {
    return [];
  }

  public visitPrint(inst: Inst.Print): Errors {
    return this.useExprLocals(inst.expr)
      .concat(this.resolveExpr(inst.expr));
  }

  /* --------------------------------------------

  Expressions

  ----------------------------------------------*/

  public passExprInvalid(_: Expr.Invalid): IResolverError[] {
    return [];
  }

  public passBinary(expr: Expr.Binary): IResolverError[] {
    return this.resolveExpr(expr.left).concat(
      this.resolveExpr(expr.right));
  }

  public passUnary(expr: Expr.Unary): IResolverError[] {
    return this.resolveExpr(expr.factor);
  }

  public passFactor(expr: Expr.Factor): IResolverError[] {
    return this.resolveExpr(expr.suffix).concat(
      this.resolveExpr(expr.exponent));
  }

  public passSuffix(expr: Expr.Suffix): IResolverError[] {
    const atom = this.resolveSuffixTerm(expr.suffixTerm);
    if (empty(expr.trailer)) {
      return atom;
    }

    return atom.concat(this.resolveSuffixTerm(expr.trailer));
  }

  public passAnonymousFunction(expr: Expr.AnonymousFunction): IResolverError[] {
    this.scopeBuilder.beginScope(expr);
    const errors = this.resolveInsts(expr.insts);
    this.scopeBuilder.endScope();

    return errors;
  }

  /* --------------------------------------------

  Suffix Terms

  ----------------------------------------------*/

  public passSuffixTermInvalid(_: SuffixTerm.Invalid): Errors {
    return [];
  }

  public passSuffixTrailer(suffixTerm: SuffixTerm.SuffixTrailer): IResolverError[] {
    const atom = this.resolveSuffixTerm(suffixTerm.suffixTerm);
    if (empty(suffixTerm.trailer)) {
      return atom;
    }

    return atom.concat(this.resolveSuffixTerm(suffixTerm.trailer));
  }

  public passSuffixTerm(suffixTerm: SuffixTerm.SuffixTerm): IResolverError[] {
    const atom = this.resolveSuffixTerm(suffixTerm.atom);
    if (suffixTerm.trailers.length === 0) {
      return atom;
    }

    return atom.concat(suffixTerm.trailers.reduce(
      (acc, curr) => acc.concat(this.resolveSuffixTerm(curr)),
      [] as IResolverError[]));
  }

  public passCall(suffixTerm: SuffixTerm.Call): IResolverError[] {
    return accumulateErrors(suffixTerm.args, this.resolveExpr.bind(this));
  }

  public passArrayIndex(_: SuffixTerm.ArrayIndex): IResolverError[] {
    return [];
  }

  public passArrayBracket(suffixTerm: SuffixTerm.ArrayBracket): IResolverError[] {
    return this.resolveExpr(suffixTerm.index);
  }

  public passDelegate(_: SuffixTerm.Delegate): IResolverError[] {
    return [];
  }

  public passLiteral(_: SuffixTerm.Literal): IResolverError[] {
    return [];
  }

  public passIdentifier(_: SuffixTerm.Identifier): IResolverError[] {
    return [];
  }

  public passGrouping(suffixTerm: SuffixTerm.Grouping): IResolverError[] {
    return this.resolveExpr(suffixTerm.expr);
  }
}

const accumulateErrors = <T>(items: T[], checker: (item: T) => Errors): Errors => {
  return items.reduce(
    (accumulator, item) => accumulator.concat(checker(item)),
    [] as Errors);
};
