import { IInstVisitor, IExprVisitor, IExpr, IInst, ScopeType } from '../parser/types';
import * as Expr from '../parser/expr';
import * as Inst from '../parser/inst';
import { ResolverError } from './resolverError';
import { Var, Lock, Func, Param } from '../parser/declare';
import { empty } from '../utilities/typeGuards';
import { LocalResolver } from './localResolver';
import { SetResolver } from './setResolver';
import { TokenType } from '../entities/tokentypes';
import { Script } from '../entities/script';
import { mockLogger, mockTracer } from '../utilities/logger';
import { ScopeBuilder } from './scopeBuilder';
import { ILocalResult, IResolverError } from './types';

export type Errors = IResolverError[];

export class Resolver implements IExprVisitor<Errors>, IInstVisitor<Errors> {
  private syntaxTree: Script;
  private scopeBuilder: ScopeBuilder;
  private readonly logger: ILogger;
  private readonly tracer: ITracer;
  private readonly localResolver: LocalResolver;
  private readonly setResolver: SetResolver;
  private lazyGlobalOff: boolean;
  private firstInst: boolean;

  constructor(
    syntaxTree: Script,
    scopeBuilder: ScopeBuilder,
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer) {

    this.syntaxTree = syntaxTree;
    this.scopeBuilder = scopeBuilder;
    this.localResolver = new LocalResolver();
    this.setResolver = new SetResolver(this.localResolver);
    this.lazyGlobalOff = false;
    this.firstInst = true;
    this.logger = logger;
    this.tracer = tracer;
  }

  // resolve the sequence of instructions
  public resolve(): Errors {
    try {
      this.scopeBuilder.rewindScope();
      this.scopeBuilder.beginScope(this.syntaxTree);
      const [firstInst, ...restInsts] = this.syntaxTree.insts;

      // check for lazy global flag
      const firstError = this.resolveInst(firstInst);
      this.firstInst = false;

      // resolve reset
      const resolveErrors = this.resolveInsts(restInsts);
      const scopeErrors = this.scopeBuilder.endScope();
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
  public visitDeclVariable(decl: Var): Errors {

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
  public visitDeclLock(decl: Lock): ResolverError[] {

    // determine scope type
    const scopeType = !empty(decl.scope)
      ? decl.scope.type
      : ScopeType.global;

    const declareError = this.scopeBuilder.declareLock(scopeType, decl.identifier);
    const useErrors = this.useExprLocals(decl.value);
    const resolveErrors = this.resolveExpr(decl.value);

    return empty(declareError)
      ? useErrors.concat(resolveErrors)
      : useErrors.concat(declareError, resolveErrors);
  }

  // check function declaration
  public visitDeclFunction(decl: Func): ResolverError[] {
    return this.resolveInst(decl.instructionBlock);
  }

  // check parameter declaration
  public visitDeclParameter(decl: Param): ResolverError[] {
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

  // tslint:disable-next-line:variable-name
  public visitInstInvalid(_inst: Inst.Invalid): Errors {
    return [];
  }

  public visitBlock(inst: Inst.Block): Errors {
    this.scopeBuilder.beginScope(inst);
    const errors = this.resolveInsts(inst.instructions);
    this.scopeBuilder.endScope();

    return errors;
  }

  public visitExpr(inst: Inst.Expr): Errors {
    return this.useExprLocals(inst.suffix).concat(
      this.resolveExpr(inst.suffix));
  }

  public visitOnOff(inst: Inst.OnOff): Errors {
    return this.useExprLocals(inst.suffix)
      .concat(this.resolveExpr(inst.suffix));
  }

  // tslint:disable-next-line:variable-name
  public visitCommand(_inst: Inst.Command): Errors {
    return [];
  }

  public visitCommandExpr(inst: Inst.CommandExpr): Errors {
    return this.useExprLocals(inst.expression).concat(
      this.resolveExpr(inst.expression));
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
    let created = false;
    if (empty(set)) {
      const [{ token }] = this.localResolver.resolveExpr(inst.suffix);
      return [new ResolverError(token, `cannot assign to variable ${token.lexeme}`, [])];
    }

    if (!this.lazyGlobalOff) {
      if (empty(this.scopeBuilder.lookupVariable(set, ScopeType.global))) {
        this.scopeBuilder.declareVariable(ScopeType.global, set);
        created = true;
      }
    }

    let defineError: Maybe<ResolverError> = undefined;
    if (!created) {
      defineError = this.scopeBuilder.defineBinding(set);
    }
    const useErrors = this.useExprLocals(inst.value).concat(this.useTokens(used));
    const resolveErrors = this.resolveExpr(inst.value);

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

    this.lazyGlobalOff = inst.onOff.type === TokenType.off;
    return [];
  }

  public visitIf(inst: Inst.If): Errors {
    const errors = this.useExprLocals(inst.condition).concat(
      this.resolveExpr(inst.condition),
      this.resolveInst(inst.instruction));

    if (inst.elseInst) {
      return errors.concat(
        this.resolveInst(inst.elseInst));
    }

    return errors;
  }

  public visitElse(inst: Inst.Else): Errors {
    return this.resolveInst(inst.instruction);
  }

  public visitUntil(inst: Inst.Until): Errors {
    return this.useExprLocals(inst.condition).concat(
      this.resolveExpr(inst.condition),
      this.resolveInst(inst.instruction));
  }

  public visitFrom(inst: Inst.From): Errors {
    this.scopeBuilder.beginScope(inst);

    const resolverErrors = this.resolveInsts(inst.initializer.instructions).concat(
      this.resolveExpr(inst.condition),
      this.resolveInsts(inst.increment.instructions),
      this.resolveInst(inst.instruction));

    const useErrors = this.useExprLocals(inst.condition);
    const scopeErrors = this.scopeBuilder.endScope();

    return resolverErrors.concat(useErrors, scopeErrors);
  }

  public visitWhen(inst: Inst.When): Errors {
    return this.useExprLocals(inst.condition).concat(
      this.resolveExpr(inst.condition),
      this.resolveInst(inst.instruction));
  }

  public visitReturn(inst: Inst.Return): Errors {
    if (inst.value) {
      return this.useExprLocals(inst.value)
        .concat(this.resolveExpr(inst.value));
    }

    return [];
  }

  // tslint:disable-next-line:variable-name
  public visitBreak(_inst: Inst.Break): Errors {
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
      this.resolveInst(inst.instruction));

    errors = errors.concat(this.scopeBuilder.endScope());
    if (!empty(declareError)) {
      return errors.concat(declareError);
    }
    return errors;
  }

  public visitOn(inst: Inst.On): Errors {
    return this.useExprLocals(inst.suffix).concat(
      this.resolveExpr(inst.suffix),
      this.resolveInst(inst.instruction));
  }

  public visitToggle(inst: Inst.Toggle): Errors {
    return this.useExprLocals(inst.suffix)
      .concat(this.resolveExpr(inst.suffix));
  }

  public visitWait(inst: Inst.Wait): Errors {
    return this.useExprLocals(inst.expression)
      .concat(this.resolveExpr(inst.expression));
  }

  public visitLog(inst: Inst.Log): Errors {
    let useErrors: Errors = [];

    // check target expression
    if (inst.target instanceof Expr.Literal) {
      switch (inst.target.token.type) {
        case TokenType.string:
        case TokenType.fileIdentifier:
          // TODO may need check some about path here
          break;
        default:
          useErrors = this.useExprLocals(inst.target);
      }
    }

    return this.useExprLocals(inst.expression).concat(
      useErrors,
      this.resolveExpr(inst.expression),
      this.resolveExpr(inst.target));
  }

  public visitCopy(inst: Inst.Copy): Errors {
    let useErrors: Errors = [];

    // check from expression
    if (inst.source instanceof Expr.Literal) {
      switch (inst.source.token.type) {
        case TokenType.string:
        case TokenType.fileIdentifier:
          // TODO may need check some about path here
          break;
        default:
          useErrors = this.useExprLocals(inst.source);
      }
    }

    // check the target location
    if (inst.target instanceof Expr.Literal) {
      switch (inst.target.token.type) {
        case TokenType.string:
        case TokenType.fileIdentifier:
          // TODO may need check some about path here
          break;
        default:
          useErrors = this.useExprLocals(inst.target);
      }
    }

    return this.useExprLocals(inst.source).concat(
      useErrors,
      this.resolveExpr(inst.source),
      this.resolveExpr(inst.target));
  }

  public visitRename(inst: Inst.Rename): Errors {
    return this.useExprLocals(inst.source).concat(
      this.useExprLocals(inst.target),
      this.resolveExpr(inst.source),
      this.resolveExpr(inst.target));
  }

  public visitDelete(inst: Inst.Delete): Errors {
    if (empty(inst.target)) {
      return this.useExprLocals(inst.expression).concat(
        this.resolveExpr(inst.expression));
    }

    return this.useExprLocals(inst.expression).concat(
      this.useExprLocals(inst.target),
      this.resolveExpr(inst.expression),
      this.resolveExpr(inst.target));
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
      return this.useExprLocals(inst.expression)
        .concat(this.resolveExpr(inst.expression));
    }

    return this.useExprLocals(inst.expression).concat(
      this.resolveExpr(inst.expression),
      accumulateErrors(inst.args, this.useExprLocals.bind(this)),
      accumulateErrors(inst.args, this.resolveExpr.bind(this)));
  }

  public visitRunPathOnce(inst: Inst.RunPathOnce): Errors {
    if (empty(inst.args)) {
      return this.useExprLocals(inst.expression)
        .concat(this.resolveExpr(inst.expression));
    }

    return this.useExprLocals(inst.expression).concat(
      this.resolveExpr(inst.expression),
      accumulateErrors(inst.args, this.useExprLocals.bind(this)),
      accumulateErrors(inst.args, this.resolveExpr.bind(this)));
  }

  public visitCompile(inst: Inst.Compile): Errors {
    if (empty(inst.target)) {
      return this.useExprLocals(inst.expression)
        .concat(this.resolveExpr(inst.expression));
    }

    return this.useExprLocals(inst.expression).concat(
      this.useExprLocals(inst.target),
      this.resolveExpr(inst.expression),
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

  // tslint:disable-next-line:variable-name
  public visitEmpty(_inst: Inst.Empty): Errors {
    return [];
  }

  public visitPrint(inst: Inst.Print): Errors {
    return this.useExprLocals(inst.expression)
      .concat(this.resolveExpr(inst.expression));
  }

  /* --------------------------------------------

  Expressions

  ----------------------------------------------*/

  // tslint:disable-next-line:variable-name
  public visitExprInvalid(_expr: Expr.Invalid): Errors {
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
    return this.resolveExpr(expr.suffix).concat(
      this.resolveExpr(expr.trailer));
  }

  public visitCall(expr: Expr.Call): Errors {
    return this.resolveExpr(expr.callee).concat(
      accumulateErrors(expr.args, this.resolveExpr.bind(this)));
  }

  public visitArrayIndex(expr: Expr.ArrayIndex): Errors {
    return this.resolveExpr(expr.array);
  }

  public visitArrayBracket(expr: Expr.ArrayBracket): Errors {
    return this.resolveExpr(expr.array).concat(
      this.resolveExpr(expr.index));
  }

  public visitDelegate(expr: Expr.Delegate): Errors {
    return this.resolveExpr(expr.variable);
  }

  // tslint:disable-next-line:variable-name
  public visitLiteral(_expr: Expr.Literal): Errors {
    return [];
  }

  // tslint:disable-next-line:variable-name
  public visitVariable(_expr: Expr.Variable): Errors {
    return [];
  }

  public visitGrouping(expr: Expr.Grouping): Errors {
    return this.resolveExpr(expr.expr);
  }

  public visitAnonymousFunction(expr: Expr.AnonymousFunction): Errors {
    this.scopeBuilder.beginScope(expr);
    const errors = this.resolveInsts(expr.instructions);
    this.scopeBuilder.endScope();

    return errors;
  }
}

const accumulateErrors = <T>(items: T[], checker: (item: T) => Errors): Errors => {
  return items.reduce(
    (accumulator, item) => accumulator.concat(checker(item)),
    [] as Errors);
};
