import {
  IInstVisitor, IExprVisitor, IExpr,
  IInst, ScopeType, ISuffixTerm,
  ISuffixTermVisitor,
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
import { ScopeBuilder } from './scopeBuilder';
import { ILocalResult, IResolverError } from './types';

export type Errors = IResolverError[];

export class Resolver implements
  IExprVisitor<Errors>,
  IInstVisitor<Errors>,
  ISuffixTermVisitor<Errors> {

  private readonly script: Script;
  private readonly scopeBuilder: ScopeBuilder;
  private readonly logger: ILogger;
  private readonly tracer: ITracer;
  private readonly localResolver: LocalResolver;
  private readonly setResolver: SetResolver;
  private lazyGlobal: boolean;
  private firstInst: boolean;

  constructor(
    script: Script,
    scopeBuilder: ScopeBuilder,
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer) {

    this.script = script;
    this.scopeBuilder = scopeBuilder;
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
    return expr.accept(this);
  }

  // resolve for an expression
  private resolveSuffixTerm(suffixTerm: ISuffixTerm): Errors {
    return suffixTerm.accept(this);
  }

  // attempt to use ever variable in the expression
  private useExprLocals(expr: IExpr): Errors {
    return this.useTokens(this.localResolver.resolveExpr(expr));
  }

  // attempt to use ever variable in the expression
  private useTokens(results: ILocalResult[]): Errors {
    return results
      .map(({ token, expr }) => this.scopeBuilder.useEntity(token, expr))
      .filter(this.filterError);
  }

  // filter to just actual errors
  private filterError(maybeError: Maybe<ResolverError>): maybeError is ResolverError {
    return !empty(maybeError);
  }

  /* --------------------------------------------

  Declarations

  ----------------------------------------------*/

  // check variable declaration
  public visitDeclVariable(decl: Decl.Var): Errors {

    // determine scope type
    const scopeType = !empty(decl.scope)
      ? decl.scope.type
      : ScopeType.global;

    const declareError = this.scopeBuilder.declareVariable(scopeType, decl.identifier);
    const useErrors = this.useExprLocals(decl.expression);
    const resolveErrors = this.resolveExpr(decl.expression);

    return empty(declareError)
      ? useErrors.concat(resolveErrors)
      : useErrors.concat(declareError, resolveErrors);
  }

  // check lock declaration
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

  // check function declaration
  public visitDeclFunction(decl: Decl.Func): ResolverError[] {
    return this.resolveInst(decl.instructionBlock);
  }

  // check parameter declaration
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

    return scopeError.concat(parameterErrors, defaultParameterErrors)
      .filter(this.filterError);
  }

  /* --------------------------------------------

  Instructions

  ----------------------------------------------*/

  public visitInstInvalid(_: Inst.Invalid): Errors {
    return [];
  }

  public visitBlock(inst: Inst.Block): Errors {
    this.scopeBuilder.beginScope(inst);
    const errors = this.resolveInsts(inst.insts);
    this.scopeBuilder.endScope();

    return errors;
  }

  public visitExpr(inst: Inst.ExprInst): Errors {
    return this.useExprLocals(inst.suffix).concat(
      this.resolveExpr(inst.suffix));
  }

  public visitOnOff(inst: Inst.OnOff): Errors {
    return this.useExprLocals(inst.suffix)
      .concat(this.resolveExpr(inst.suffix));
  }

  public visitCommand(_: Inst.Command): Errors {
    return [];
  }

  public visitCommandExpr(inst: Inst.CommandExpr): Errors {
    return this.useExprLocals(inst.expr).concat(
      this.resolveExpr(inst.expr));
  }

  public visitUnset(inst: Inst.Unset): Errors {
    const error = this.scopeBuilder.useVariable(inst.identifier);
    return empty(error) ? [] : [error];
  }

  public visitUnlock(inst: Inst.Unlock): Errors {
    const error = this.scopeBuilder.useLock(inst.identifier);
    return empty(error) ? [] : [error];
  }

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

    const useErrors = this.useExprLocals(inst.expr).concat(this.useTokens(used));
    const resolveErrors = this.resolveExpr(inst.expr);

    return !empty(defineError)
      ? useErrors.concat(resolveErrors, defineError)
      : useErrors.concat(resolveErrors);
  }

  public visitLazyGlobalInst(inst: Inst.LazyGlobal): Errors {
    // It is an error if lazy global is not at the start of a file
    if (!this.firstInst) {
      return [
        new ResolverError(inst.lazyGlobal, 'Lazy global was not declared at top of the file', []),
      ];
    }

    this.lazyGlobal = inst.onOff.type === TokenType.on;
    return [];
  }

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

  public visitElse(inst: Inst.Else): Errors {
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

  public visitExprInvalid(_: Expr.Invalid): Errors {
    return [];
  }

  public visitBinary(expr: Expr.Binary): Errors {
    return this.resolveExpr(expr.left).concat(
      this.resolveExpr(expr.right));
  }

  public visitUnary(expr: Expr.Unary): Errors {
    return this.resolveExpr(expr.factor);
  }

  public visitFactor(expr: Expr.Factor): Errors {
    return this.resolveExpr(expr.suffix).concat(
      this.resolveExpr(expr.exponent));
  }

  public visitSuffix(expr: Expr.Suffix): Errors {
    const atom = this.resolveSuffixTerm(expr.suffixTerm);
    if (empty(expr.trailer)) {
      return atom;
    }

    return atom.concat(this.resolveSuffixTerm(expr.trailer));
  }

  /* --------------------------------------------

  Suffix Terms

  ----------------------------------------------*/

  public visitSuffixTermInvalid(_: SuffixTerm.Invalid): Errors {
    return [];
  }

  public visitSuffixTrailer(expr: SuffixTerm.SuffixTrailer): IResolverError[] {
    const atom = this.resolveSuffixTerm(expr.suffixTerm);
    if (empty(expr.trailer)) {
      return atom;
    }

    return atom.concat(this.resolveSuffixTerm(expr.trailer));
  }

  public visitSuffixTerm(expr: SuffixTerm.SuffixTerm): IResolverError[] {
    const atom = this.resolveSuffixTerm(expr.atom);
    if (expr.trailers.length === 0) {
      return atom;
    }

    return atom.concat(expr.trailers.reduce(
      (acc, curr) => acc.concat(this.resolveSuffixTerm(curr)),
      [] as IResolverError[]));
  }

  public visitCall(expr: SuffixTerm.Call): Errors {
    return accumulateErrors(expr.args, this.resolveExpr.bind(this));
  }

  public visitArrayIndex(_: SuffixTerm.ArrayIndex): Errors {
    return [];
  }

  public visitArrayBracket(expr: SuffixTerm.ArrayBracket): Errors {
    return this.resolveExpr(expr.index);
  }

  public visitDelegate(_: SuffixTerm.Delegate): Errors {
    return [];
  }

  public visitLiteral(_: SuffixTerm.Literal): Errors {
    return [];
  }

  public visitIdentifier(_: SuffixTerm.Identifier): Errors {
    return [];
  }

  public visitGrouping(expr: SuffixTerm.Grouping): Errors {
    return this.resolveExpr(expr.expr);
  }

  public visitAnonymousFunction(expr: Expr.AnonymousFunction): Errors {
    this.scopeBuilder.beginScope(expr);
    const errors = this.resolveInsts(expr.insts);
    this.scopeBuilder.endScope();

    return errors;
  }
}

const accumulateErrors = <T>(items: T[], checker: (item: T) => Errors): Errors => {
  return items.reduce(
    (accumulator, item) => accumulator.concat(checker(item)),
    [] as Errors);
};
