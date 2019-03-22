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
import { ILocalResult, IResolverError, ResolverErrorKind } from './types';

export type Errors = IResolverError[];

export class Resolver implements
  IInstVisitor<Errors>,
  IInstPasser<Errors>,
  IExprPasser<Errors>,
  ISuffixTermPasser<Errors> {

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
    tracer: ITracer = mockTracer) {

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
  public resolve(): Errors {
    try {
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
      return firstError.concat(resolveErrors, scopeErrors);
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
  private resolveInsts(insts: IInst[]): Errors {
    return accumulateErrors(insts, this.resolveInst.bind(this));
  }

  /**
   * Resolve instruction
   * @param inst resolve instruction
   */
  private resolveInst(inst: IInst): Errors {
    return inst.accept(this);
  }

  /**
   * Pass through expression
   * @param expr expression to skip
   */
  private skipExpr(expr: IExpr): Errors {
    return expr.pass(this);
  }

  /**
   * Pass through suffix term
   * @param suffixTerm suffix term to skip
   */
  private skipSuffixTerm(suffixTerm: ISuffixTerm): Errors {
    return suffixTerm.pass(this);
  }

  /**
   * attempt to use ever variable in the expression
   * @param expr expression to use
   */
  private useExprLocals(expr: IExpr): Errors {
    return this.useTokens(this.localResolver.resolveExpr(expr));
  }

  /**
   * attempt to use ever token in the collection
   * @param results local results to use
   */
  private useTokens(results: ILocalResult[]): Errors {
    return results
      .map(({ token, expr }) => this.tableBuilder.useSymbol(token, expr))
      .filter(this.filterError);
  }

  /**
   * filter to just errors
   * @param maybeError potential error
   */
  private filterError(maybeError: Maybe<IResolverError>): maybeError is IResolverError {
    return !empty(maybeError);
  }

  /* --------------------------------------------

  Declarations

  ----------------------------------------------*/

  /**
   * Visit the declare variable syntax node
   * @param decl the syntax node
   */
  public visitDeclVariable(decl: Decl.Var): Errors {

    // determine scope type
    const scopeType = !empty(decl.scope)
      ? decl.scope.type
      : ScopeType.global;

    const declareError = this.tableBuilder.declareVariable(scopeType, decl.identifier);
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
  public passDeclVariable(decl: Decl.Var): IResolverError[] {
    return this.skipExpr(decl.value);
  }

  /**
   * Visit the declare lock syntax node
   * @param decl the syntax node
   */
  public visitDeclLock(decl: Decl.Lock): IResolverError[] {

    // determine scope type
    const scopeType = !empty(decl.scope)
      ? decl.scope.type
      : ScopeType.global;

    const lookup = this.tableBuilder.lookupLock(decl.identifier, ScopeType.global);
    let declareError: Maybe<ResolverError> = undefined;

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
  public passDeclLock(decl: Decl.Lock): IResolverError[] {
    return this.skipExpr(decl.value);
  }

  /**
   * Visit the declare function syntax node
   * @param decl the syntax node
   */
  public visitDeclFunction(decl: Decl.Func): IResolverError[] {
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
  public visitDeclParameter(decl: Decl.Param): IResolverError[] {
    const scopeError: Maybe<IResolverError>[] = [];

    // check that parameter isn't declared global
    if (!empty(decl.scope) && !empty(decl.scope.scope)) {
      if (decl.scope.scope.type === TokenType.global) {
        scopeError.push(new ResolverError(
          decl.scope.scope,
          'Parameters cannot be global',
          ResolverErrorKind.error,
          []));
      }
    }

    // all parameters are local
    const scopeType = ScopeType.local;

    // need to check if default paraemter can really be abbitrary expr
    const parameterErrors = decl.parameters
      .map(parameter => this.tableBuilder.declareParameter(scopeType, parameter.identifier, false));
    const defaultParameterErrors = decl.defaultParameters
      .map(parameter => this.tableBuilder.declareParameter(scopeType, parameter.identifier, true));
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
      this.skipExpr.bind(this));
  }

  /* --------------------------------------------

  Instructions

  ----------------------------------------------*/

  /**
   * Visit the Invalid Inst syntax node
   * @param inst the syntax node
   */
  public visitInstInvalid(_: Inst.Invalid): Errors {
    return [];
  }

  /**
   * Pass through the Invalid Inst syntax node
   * @param inst the syntax node
   */
  public passInstInvalid(_: Inst.Invalid): IResolverError[] {
    return [];
  }

  /**
   * Visit the Block Inst syntax node
   * @param inst the syntax node
   */
  public visitBlock(inst: Inst.Block): Errors {
    this.tableBuilder.beginScope(inst);
    const errors = this.resolveInsts(inst.insts);
    this.tableBuilder.endScope();

    return errors;
  }

  /**
   * Pass through the Block Inst syntax node
   * @param inst the syntax node
   */
  public passBlock(inst: Inst.Block): IResolverError[] {
    this.tableBuilder.beginScope(inst);
    const errors = this.resolveInsts(inst.insts);
    this.tableBuilder.endScope();

    return errors;
  }

  /**
   * Visit the Expr Inst syntax node
   * @param inst the syntax node
   */
  public visitExpr(inst: Inst.ExprInst): Errors {
    return this.useExprLocals(inst.suffix).concat(
      this.skipExpr(inst.suffix));
  }

  /**
   * Pass through the Expr Inst syntax node
   * @param inst the syntax node
   */
  public passExpr(inst: Inst.ExprInst): IResolverError[] {
    return this.skipExpr(inst.suffix);
  }

  /**
   * Visit the On Off Inst syntax node
   * @param inst the syntax node
   */
  public visitOnOff(inst: Inst.OnOff): Errors {
    return this.useExprLocals(inst.suffix)
      .concat(this.skipExpr(inst.suffix));
  }

  /**
   * Pass through the On Off Inst syntax node
   * @param inst the syntax node
   */
  public passOnOff(inst: Inst.OnOff): IResolverError[] {
    return this.skipExpr(inst.suffix);
  }

  /**
   * Visit the Command Inst syntax node
   * @param inst the syntax node
   */
  public visitCommand(_: Inst.Command): Errors {
    return [];
  }

  /**
   * Pass through the Command Inst syntax node
   * @param inst the syntax node
   */
  public passCommand(_: Inst.Command): IResolverError[] {
    return [];
  }

  /**
   * Visit the Command Expr Inst syntax node
   * @param inst the syntax node
   */
  public visitCommandExpr(inst: Inst.CommandExpr): Errors {
    return this.useExprLocals(inst.expr).concat(
      this.skipExpr(inst.expr));
  }

  /**
   * Pass through the Command Expr Inst syntax node
   * @param inst the syntax node
   */
  public passCommandExpr(inst: Inst.CommandExpr): IResolverError[] {
    return this.skipExpr(inst.expr);
  }

  /**
   * Visit the Unset Inst syntax node
   * @param inst the syntax node
   */
  public visitUnset(inst: Inst.Unset): Errors {
    const error = this.tableBuilder.useVariable(inst.identifier);
    return empty(error) ? [] : [error];
  }

  /**
   * Pass through the Unset Inst syntax node
   * @param inst the syntax node
   */
  public passUnset(_: Inst.Unset): IResolverError[] {
    return [];
  }

  /**
   * Visit the Unlock Inst syntax node
   * @param inst the syntax node
   */
  public visitUnlock(inst: Inst.Unlock): Errors {
    const error = this.tableBuilder.useLock(inst.identifier);
    return empty(error) ? [] : [error];
  }

  /**
   * Pass through the Unlock Inst syntax node
   * @param inst the syntax node
   */
  public passUnlock(_: Inst.Unlock): IResolverError[] {
    return [];
  }

  /**
   * Visit the Set Inst syntax node
   * @param inst the syntax node
   */
  public visitSet(inst: Inst.Set): Errors {
    const { set, used } = this.setResolver.resolveExpr(inst.suffix);

    // check if a set target exists
    if (empty(set)) {
      const [{ token }] = this.localResolver.resolveExpr(inst.suffix);
      return [new ResolverError(
        token,
        `cannot assign to variable ${token.lexeme}`,
        ResolverErrorKind.error,
        [])];
    }

    // if variable isn't define either report error or define
    let defineError: Maybe<ResolverError> = undefined;
    if (empty(this.tableBuilder.lookupVariable(set, ScopeType.global))) {
      if (!this.lazyGlobal) {
        defineError = new ResolverError(
          set,
          `Attempted to set ${set.lexeme} which has not be declared.` +
          `Either remove lazy global directive or declare ${set.lexeme}`,
          ResolverErrorKind.error,
          []);
      } else {
        this.tableBuilder.declareVariable(ScopeType.global, set);
      }
    }

    const useErrors = this.useExprLocals(inst.value).concat(this.useTokens(used));
    const resolveErrors = this.skipExpr(inst.value);

    return !empty(defineError)
      ? useErrors.concat(resolveErrors, defineError)
      : useErrors.concat(resolveErrors);
  }

  /**
   * Pass through the Unlock Inst syntax node
   * @param inst the syntax node
   */
  public passSet(inst: Inst.Set): IResolverError[] {
    return this.skipExpr(inst.suffix)
      .concat(this.skipExpr(inst.value));
  }

  /**
   * Visit the Lazy Global Inst syntax node
   * @param inst the syntax node
   */
  public visitLazyGlobal(inst: Inst.LazyGlobal): Errors {
    // It is an error if lazy global is not at the start of a file
    if (!this.firstInst) {
      return [
        new ResolverError(
          inst.lazyGlobal,
          'Lazy global was not declared at top of the file',
          ResolverErrorKind.error,
          []),
      ];
    }

    this.lazyGlobal = inst.onOff.type === TokenType.on;
    return [];
  }

  /**
   * Pass Through the Lazy Global Inst syntax node
   * @param inst the syntax node
   */
  public passLazyGlobal(_: Inst.LazyGlobal): IResolverError[] {
    return [];
  }

  /**
   * Visit the If Inst syntax node
   * @param inst the syntax node
   */
  public visitIf(inst: Inst.If): Errors {
    const errors = this.useExprLocals(inst.condition).concat(
      this.skipExpr(inst.condition),
      this.resolveInst(inst.ifInst));

    if (inst.elseInst) {
      return errors.concat(
        this.resolveInst(inst.elseInst));
    }

    return errors;
  }

  /**
   * Pass Through the If Inst syntax node
   * @param inst the syntax node
   */
  public passIf(inst: Inst.If): IResolverError[] {
    const errors = this.skipExpr(inst.condition)
      .concat(this.resolveInst(inst.ifInst));

    if (inst.elseInst) {
      return errors.concat(
        this.resolveInst(inst.elseInst));
    }

    return errors;
  }

  /**
   * Visit the Else Inst syntax node
   * @param inst the syntax node
   */
  public visitElse(inst: Inst.Else): Errors {
    return this.resolveInst(inst.inst);
  }

  /**
   * Pass Through the Else Inst syntax node
   * @param inst the syntax node
   */
  public passElse(inst: Inst.Else): IResolverError[] {
    return this.resolveInst(inst.inst);
  }

  /**
   * Visit the When Inst syntax node
   * @param inst the syntax node
   */
  public visitUntil(inst: Inst.Until): Errors {
    return this.useExprLocals(inst.condition).concat(
      this.skipExpr(inst.condition),
      this.resolveInst(inst.inst));
  }

  /**
   * Pass Through the When Inst syntax node
   * @param inst the syntax node
   */
  public passUntil(inst: Inst.Until): IResolverError[] {
    return this.skipExpr(inst.condition).concat(
      this.resolveInst(inst.inst));
  }

  /**
   * Visit the From Inst syntax node
   * @param inst the syntax node
   */
  public visitFrom(inst: Inst.From): Errors {
    this.tableBuilder.beginScope(inst);

    const resolverErrors = this.resolveInsts(inst.initializer.insts).concat(
      this.skipExpr(inst.condition),
      this.resolveInsts(inst.increment.insts),
      this.resolveInst(inst.inst));

    const useErrors = this.useExprLocals(inst.condition);
    const scopeErrors = this.tableBuilder.endScope();

    return resolverErrors.concat(useErrors, scopeErrors);
  }

  /**
   * Pass Through the From Inst syntax node
   * @param inst the syntax node
   */
  public passFrom(inst: Inst.From): IResolverError[] {
    this.tableBuilder.beginScope(inst);

    const resolverErrors = this.resolveInsts(inst.initializer.insts).concat(
      this.skipExpr(inst.condition),
      this.resolveInsts(inst.increment.insts),
      this.resolveInst(inst.inst));

    const scopeErrors = this.tableBuilder.endScope();

    return resolverErrors.concat(scopeErrors);
  }

  /**
   * Visit the When Inst syntax node
   * @param inst the syntax node
   */
  public visitWhen(inst: Inst.When): Errors {
    return this.useExprLocals(inst.condition).concat(
      this.skipExpr(inst.condition),
      this.resolveInst(inst.inst));
  }

  /**
   * Pass Through the When Inst syntax node
   * @param inst the syntax node
   */
  public passWhen(inst: Inst.When): IResolverError[] {
    return this.skipExpr(inst.condition).concat(
      this.resolveInst(inst.inst));
  }

  /**
   * Visit the Return Inst syntax node
   * @param inst the syntax node
   */
  public visitReturn(inst: Inst.Return): Errors {
    if (inst.expr) {
      return this.useExprLocals(inst.expr)
        .concat(this.skipExpr(inst.expr));
    }

    return [];
  }

  /**
   * Pass Through the Return Inst syntax node
   * @param inst the syntax node
   */
  public passReturn(inst: Inst.Return): IResolverError[] {
    return !empty(inst.expr) ? this.skipExpr(inst.expr) : [];
  }

  /**
   * Visit the Break Inst syntax node
   * @param inst the syntax node
   */
  public visitBreak(_: Inst.Break): Errors {
    return [];
  }

  /**
   * Pass Through the Break Inst syntax node
   * @param inst the syntax node
   */
  public passBreak(_: Inst.Break): IResolverError[] {
    return [];
  }

  /**
   * Visit the Switch Inst syntax node
   * @param inst the syntax node
   */
  public visitSwitch(inst: Inst.Switch): Errors {
    return this.useExprLocals(inst.target)
      .concat(this.skipExpr(inst.target));
  }

  /**
   * Pass Through the Switch Inst syntax node
   * @param inst the syntax node
   */
  public passSwitch(inst: Inst.Switch): IResolverError[] {
    return this.skipExpr(inst.target);
  }

  /**
   * Visit the For Inst syntax node
   * @param inst the syntax node
   */
  public visitFor(inst: Inst.For): Errors {
    this.tableBuilder.beginScope(inst);
    const declareError = this.tableBuilder.declareVariable(ScopeType.local, inst.identifier);

    const errors = this.useExprLocals(inst.suffix).concat(
      this.skipExpr(inst.suffix),
      this.resolveInst(inst.inst),
      this.tableBuilder.endScope());

    if (!empty(declareError)) {
      return errors.concat(declareError);
    }
    return errors;
  }

  /**
   * Pass Through the For Inst syntax node
   * @param inst the syntax node
   */
  public passFor(inst: Inst.For): IResolverError[] {
    this.tableBuilder.beginScope(inst);

    return this.skipExpr(inst.suffix).concat(
      this.resolveInst(inst.inst),
      this.tableBuilder.endScope());
  }

  /**
   * Visit the On Inst syntax node
   * @param inst the syntax node
   */
  public visitOn(inst: Inst.On): Errors {
    return this.useExprLocals(inst.suffix).concat(
      this.skipExpr(inst.suffix),
      this.resolveInst(inst.inst));
  }

  /**
   * Pass Through the On Inst syntax node
   * @param inst the syntax node
   */
  public passOn(inst: Inst.On): IResolverError[] {
    return this.skipExpr(inst.suffix).concat(
      this.resolveInst(inst.inst));
  }

  /**
   * Visit the Toggle Inst syntax node
   * @param inst the syntax node
   */
  public visitToggle(inst: Inst.Toggle): Errors {
    return this.useExprLocals(inst.suffix)
      .concat(this.skipExpr(inst.suffix));
  }

  /**
   * Pass Through the Toggle Inst syntax node
   * @param inst the syntax node
   */
  public passToggle(inst: Inst.Toggle): IResolverError[] {
    return this.skipExpr(inst.suffix);
  }

  /**
   * Visit the Wait Inst syntax node
   * @param inst the syntax node
   */
  public visitWait(inst: Inst.Wait): Errors {
    return this.useExprLocals(inst.expr)
      .concat(this.skipExpr(inst.expr));
  }

  /**
   * Pass Through the Wait Inst syntax node
   * @param inst the syntax node
   */
  public passWait(inst: Inst.Wait): IResolverError[] {
    return this.skipExpr(inst.expr);
  }

  /**
   * Visit the Log Inst syntax node
   * @param inst the syntax node
   */
  public visitLog(inst: Inst.Log): Errors {
    return this.useExprLocals(inst.expr).concat(
      this.skipExpr(inst.expr),
      this.skipExpr(inst.target));
  }

  /**
   * Pass Through the Log Inst syntax node
   * @param inst the syntax node
   */
  public passLog(inst: Inst.Log): IResolverError[] {
    return this.skipExpr(inst.expr).concat(
      this.skipExpr(inst.target));
  }

  /**
   * Visit the Copy Inst syntax node
   * @param inst the syntax node
   */
  public visitCopy(inst: Inst.Copy): Errors {
    return this.useExprLocals(inst.target).concat(
      new ResolverError(inst, 'Copy is deprecated as of 1.0.0', ResolverErrorKind.warning, []),
      this.skipExpr(inst.target),
      this.skipExpr(inst.destination));
  }

  /**
   * Pass Through the Copy Inst syntax node
   * @param inst the syntax node
   */
  public passCopy(inst: Inst.Copy): IResolverError[] {
    return this.skipExpr(inst.target).concat(
      this.skipExpr(inst.destination));
  }

  /**
   * Visit the Rename Inst syntax node
   * @param inst the syntax node
   */
  public visitRename(inst: Inst.Rename): Errors {
    return this.useExprLocals(inst.target).concat(
      new ResolverError(inst, 'Rename is deprecated as of 1.0.0', ResolverErrorKind.warning, []),
      this.useExprLocals(inst.alternative),
      this.skipExpr(inst.target),
      this.skipExpr(inst.alternative));
  }

  /**
   * Pass Through the Rename Inst syntax node
   * @param inst the syntax node
   */
  public passRename(inst: Inst.Rename): IResolverError[] {
    return this.skipExpr(inst.target).concat(
      this.skipExpr(inst.alternative));
  }

  /**
   * Visit the Delete Inst syntax node
   * @param inst the syntax node
   */
  public visitDelete(inst: Inst.Delete): Errors {
    const deprecated = new ResolverError(
      inst, 'Copy is deprecated as of 1.0.0', ResolverErrorKind.warning, []);

    if (empty(inst.volume)) {
      return this.useExprLocals(inst.target).concat(
        deprecated,
        this.skipExpr(inst.target));
    }

    return this.useExprLocals(inst.target).concat(
      deprecated,
      this.useExprLocals(inst.volume),
      this.skipExpr(inst.target),
      this.skipExpr(inst.volume));
  }

  /**
   * Pass Through the Delete Inst syntax node
   * @param inst the syntax node
   */
  public passDelete(inst: Inst.Delete): IResolverError[] {
    if (empty(inst.volume)) {
      return this.skipExpr(inst.target);
    }

    return this.skipExpr(inst.target).concat(
      this.skipExpr(inst.volume));
  }

  /**
   * Visit the Run Inst syntax node
   * @param inst the syntax node
   */
  public visitRun(inst: Inst.Run): Errors {
    if (empty(inst.args) && empty(inst.expr)) {
      return [];
    }

    const argError = !empty(inst.args)
      ? accumulateErrors(inst.args, this.useExprLocals.bind(this)).concat(
          accumulateErrors(inst.args, this.skipExpr.bind(this)))
      : [];

    if (empty(inst.expr)) {
      return argError;
    }

    return this.useExprLocals(inst.expr).concat(
      this.skipExpr(inst.expr),
      argError);
  }

  /**
   * Pass Through the Run Inst syntax node
   * @param inst the syntax node
   */
  public passRun(inst: Inst.Run): IResolverError[] {
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
  public visitRunPath(inst: Inst.RunPath): Errors {
    if (empty(inst.args)) {
      return this.useExprLocals(inst.expr)
        .concat(this.skipExpr(inst.expr));
    }

    return this.useExprLocals(inst.expr).concat(
      this.skipExpr(inst.expr),
      accumulateErrors(inst.args, this.useExprLocals.bind(this)),
      accumulateErrors(inst.args, this.skipExpr.bind(this)));
  }

  /**
   * Pass Through the RunPath Inst syntax node
   * @param inst the syntax node
   */
  public passRunPath(inst: Inst.RunPath): IResolverError[] {
    if (empty(inst.args)) {
      return this.skipExpr(inst.expr);
    }

    return this.skipExpr(inst.expr).concat(
      accumulateErrors(inst.args, this.skipExpr.bind(this)));
  }

  /**
   * Visit the RunPathOnce Inst syntax node
   * @param inst the syntax node
   */
  public visitRunPathOnce(inst: Inst.RunPathOnce): Errors {
    if (empty(inst.args)) {
      return this.useExprLocals(inst.expr)
        .concat(this.skipExpr(inst.expr));
    }

    return this.useExprLocals(inst.expr).concat(
      this.skipExpr(inst.expr),
      accumulateErrors(inst.args, this.useExprLocals.bind(this)),
      accumulateErrors(inst.args, this.skipExpr.bind(this)));
  }

  /**
   * Pass Through the RunPathOnce Inst syntax node
   * @param inst the syntax node
   */
  public passRunPathOnce(inst: Inst.RunPathOnce): IResolverError[] {
    if (empty(inst.args)) {
      return this.skipExpr(inst.expr);
    }

    return this.skipExpr(inst.expr).concat(
      accumulateErrors(inst.args, this.skipExpr.bind(this)));
  }

  /**
   * Visit the Compile Inst syntax node
   * @param inst the syntax node
   */
  public visitCompile(inst: Inst.Compile): Errors {
    if (empty(inst.destination)) {
      return this.useExprLocals(inst.target)
        .concat(this.skipExpr(inst.target));
    }

    return this.useExprLocals(inst.target).concat(
      this.useExprLocals(inst.destination),
      this.skipExpr(inst.target),
      this.skipExpr(inst.destination));
  }

  /**
   * Pass Through the Compile Inst syntax node
   * @param inst the syntax node
   */
  public passCompile(inst: Inst.Compile): IResolverError[] {
    if (empty(inst.destination)) {
      return this.skipExpr(inst.target);
    }

    return this.skipExpr(inst.target).concat(
      this.skipExpr(inst.destination));
  }

  /**
   * Visit the List Inst syntax node
   * @param inst the syntax node
   */
  public visitList(inst: Inst.List): Errors {
    // list generates new variable when target is used
    if (empty(inst.target)) {
      return [];
    }

    const declareError = this.tableBuilder.declareVariable(ScopeType.local, inst.target);
    return !empty(declareError) ? [declareError] : [];
  }

  /**
   * Pass Through the List Inst syntax node
   * @param inst the syntax node
   */
  public passList(_: Inst.List): IResolverError[] {
    return [];
  }

  /**
   * Visit the Empty Inst syntax node
   * @param inst the syntax node
   */
  public visitEmpty(_: Inst.Empty): Errors {
    return [];
  }

  /**
   * Pass Through the Empty Inst syntax node
   * @param inst the syntax node
   */
  public passEmpty(_: Inst.Empty): IResolverError[] {
    return [];
  }

  /**
   * Visit the Print Inst syntax node
   * @param inst the syntax node
   */
  public visitPrint(inst: Inst.Print): Errors {
    return this.useExprLocals(inst.expr)
      .concat(this.skipExpr(inst.expr));
  }

  /**
   * Pass Through the Print Inst syntax node
   * @param inst the syntax node
   */
  public passPrint(inst: Inst.Print): IResolverError[] {
    return this.skipExpr(inst.expr);
  }

  /* --------------------------------------------

  Expressions

  ----------------------------------------------*/

  public passExprInvalid(_: Expr.Invalid): IResolverError[] {
    return [];
  }

  public passBinary(expr: Expr.Binary): IResolverError[] {
    return this.skipExpr(expr.left).concat(
      this.skipExpr(expr.right));
  }

  public passUnary(expr: Expr.Unary): IResolverError[] {
    return this.skipExpr(expr.factor);
  }

  public passFactor(expr: Expr.Factor): IResolverError[] {
    return this.skipExpr(expr.suffix).concat(
      this.skipExpr(expr.exponent));
  }

  public passSuffix(expr: Expr.Suffix): IResolverError[] {
    const atom = this.passSuffixTerm(expr.suffixTerm);
    if (empty(expr.trailer)) {
      return atom;
    }

    return atom.concat(this.skipSuffixTerm(expr.trailer));
  }

  public passAnonymousFunction(expr: Expr.AnonymousFunction): IResolverError[] {
    this.tableBuilder.beginScope(expr);
    const errors = this.resolveInsts(expr.insts);
    this.tableBuilder.endScope();

    return errors;
  }

  /* --------------------------------------------

  Suffix Terms

  ----------------------------------------------*/

  public passSuffixTermInvalid(_: SuffixTerm.Invalid): Errors {
    return [];
  }

  public passSuffixTrailer(suffixTerm: SuffixTerm.SuffixTrailer): IResolverError[] {
    const atom = this.passSuffixTerm(suffixTerm.suffixTerm);
    if (empty(suffixTerm.trailer)) {
      return atom;
    }

    return atom.concat(this.skipSuffixTerm(suffixTerm.trailer));
  }

  public passSuffixTerm(suffixTerm: SuffixTerm.SuffixTerm): IResolverError[] {
    const atom = this.skipSuffixTerm(suffixTerm.atom);
    if (suffixTerm.trailers.length === 0) {
      return atom;
    }

    return atom.concat(suffixTerm.trailers.reduce(
      (acc, curr) => acc.concat(this.skipSuffixTerm(curr)),
      [] as IResolverError[]));
  }

  public passCall(suffixTerm: SuffixTerm.Call): IResolverError[] {
    return accumulateErrors(suffixTerm.args, this.skipExpr.bind(this));
  }

  public passArrayIndex(_: SuffixTerm.ArrayIndex): IResolverError[] {
    return [];
  }

  public passArrayBracket(suffixTerm: SuffixTerm.ArrayBracket): IResolverError[] {
    return this.skipExpr(suffixTerm.index);
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
    return this.skipExpr(suffixTerm.expr);
  }
}

const accumulateErrors = <T>(items: T[], checker: (item: T) => Errors): Errors => {
  return items.reduce(
    (accumulator, item) => accumulator.concat(checker(item)),
    [] as Errors);
};
