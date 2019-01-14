import { IInstVisitor, IExprVisitor, IExpr, IInst, ScopeType } from '../parser/types';
import {
    BinaryExpr, UnaryExpr,
    FactorExpr, SuffixExpr,
    CallExpr, ArrayIndexExpr,
    ArrayBracketExpr, DelegateExpr,
    LiteralExpr, VariableExpr,
    GroupingExpr, AnonymousFunctionExpr, InvalidExpr,
} from '../parser/expr';
import {
    BlockInst, ExprInst,
    OnOffInst, CommandInst,
    CommandExpressionInst,
    UnsetInst, UnlockInst,
    SetInst, LazyGlobalInst,
    IfInst, ElseInst,
    UntilInst, FromInst,
    WhenInst, ReturnInst,
    BreakInst, SwitchInst,
    ForInst, OnInst,
    ToggleInst, WaitInst,
    LogInst, CopyInst,
    RenameInst, DeleteInst,
    RunInst, RunPathInst,
    RunPathOnceInst, CompileInst,
    ListInst, EmptyInst,
    PrintInst,
    InvalidInst,
} from '../parser/inst';
import { ResolverError } from './resolverError';
import { DeclVariable, DeclLock, DeclFunction, DeclParameter } from '../parser/declare';
import { empty } from '../utilities/typeGuards';
import { LocalResolver } from './localResolver';
import { SetResolver } from './setResolver';
import { ScopeManager } from './scopeManager';
import { TokenType } from '../entities/tokentypes';
import { SyntaxTree } from '../entities/syntaxTree';
import { mockLogger, mockTracer } from '../utilities/logger';
import { IToken } from '../entities/types';

// tslint:disable-next-line:prefer-array-literal
export type Errors = Array<ResolverError>;

export class Resolver implements IExprVisitor<Errors>, IInstVisitor<Errors> {
  private syntaxTree: SyntaxTree;
  private scopeMan: ScopeManager;
  private readonly logger: ILogger;
  private readonly tracer: ITracer;
  private readonly localResolver: LocalResolver;
  private readonly setResolver: SetResolver;
  private lazyGlobalOff: boolean;
  private firstInst: boolean;

  constructor(logger: ILogger = mockLogger, tracer: ITracer = mockTracer) {
    this.syntaxTree = new SyntaxTree([]);
    this.scopeMan = new ScopeManager();
    this.localResolver = new LocalResolver();
    this.setResolver = new SetResolver(this.localResolver);
    this.lazyGlobalOff = false;
    this.firstInst = true;
    this.logger = logger;
    this.tracer = tracer;
  }

  // resolve the sequence of instructions
  public resolve(syntaxTree: SyntaxTree, scopeMan: ScopeManager): Errors {
    try {
      this.setSyntaxTree(syntaxTree, scopeMan);
      this.scopeMan.beginScope(this.syntaxTree);
      const [firstInst, ...restInsts] = this.syntaxTree.insts;

      // check for lazy global flag
      const firstError = this.resolveInst(firstInst);
      this.firstInst = false;

      // resolve reset
      const resolveErrors = this.resolveInsts(restInsts);
      const scopeErrors = this.scopeMan.endScope();
      return firstError.concat(resolveErrors, scopeErrors);
    } catch (err) {
      this.logger.error(`Error occured in resolver ${err}`);
      this.tracer.log(err);

      return [];
    }
  }

  // set the syntax tree and scope manager
  private setSyntaxTree(syntaxTree: SyntaxTree, scopeMan: ScopeManager): void {
    this.syntaxTree = syntaxTree;
    this.scopeMan = scopeMan;
    this.scopeMan.rewindScope();
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

  // attempt to declare ever variable in the expression
  private declareLocals(scopeType: ScopeType, expr: IExpr): Errors {
    return this.localResolver.resolveExpr(expr)
      .map(variable => this.scopeMan.declareVariable(scopeType, variable))
      .filter(this.filterError);
  }

  // attempt to use ever variable in the expression
  private useExprLocals(expr: IExpr): Errors {
    return this.useTokens(this.localResolver.resolveExpr(expr));
  }

  // attempt to use ever variable in the expression
  private useTokens(tokens: IToken[]): Errors {
    return tokens
      .map(entity => this.scopeMan.useEntity(entity))
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
  public visitDeclVariable(decl: DeclVariable): Errors {

    // determine scope type
    const scopeType = !empty(decl.scope)
      ? decl.scope.type
      : ScopeType.global;

    const declareErrors = this.declareLocals(scopeType, decl.suffix);
    const useErrors = this.useExprLocals(decl.expression);
    const resolveErrors = this.resolveExpr(decl.expression);

    return declareErrors.concat(useErrors, resolveErrors);
  }

  // check lock declaration
  public visitDeclLock(decl: DeclLock): ResolverError[] {

    // determine scope type
    const scopeType = !empty(decl.scope)
      ? decl.scope.type
      : ScopeType.global;

    const declareError = this.scopeMan.declareLock(scopeType, decl.identifier);
    const useErrors = this.useExprLocals(decl.value);
    const resolveErrors = this.resolveExpr(decl.value);

    return empty(declareError)
      ? useErrors.concat(resolveErrors)
      : useErrors.concat(declareError, resolveErrors);
  }

  // check function declaration
  public visitDeclFunction(decl: DeclFunction): ResolverError[] {
    return this.resolveInst(decl.instructionBlock);
  }

  // check parameter declaration
  public visitDeclParameter(decl: DeclParameter): ResolverError[] {
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
      .map(parameter => this.scopeMan.declareParameter(scopeType, parameter.identifier, false));
    const defaultParameterErrors = decl.defaultParameters
      .map(parameter => this.scopeMan.declareParameter(scopeType, parameter.identifier, true));

    return scopeError.concat(parameterErrors, defaultParameterErrors)
      .filter(this.filterError);
  }

  /* --------------------------------------------

  Instructions

  ----------------------------------------------*/

  // tslint:disable-next-line:variable-name
  public visitInstInvalid(_inst: InvalidInst): Errors {
    return [];
  }

  public visitBlock(inst: BlockInst): Errors {
    this.scopeMan.beginScope(inst);
    const errors = this.resolveInsts(inst.instructions);
    this.scopeMan.endScope();

    return errors;
  }

  public visitExpr(inst: ExprInst): Errors {
    return this.useExprLocals(inst.suffix).concat(
      this.resolveExpr(inst.suffix));
  }

  public visitOnOff(inst: OnOffInst): Errors {
    return this.useExprLocals(inst.suffix)
      .concat(this.resolveExpr(inst.suffix));
  }

  // tslint:disable-next-line:variable-name
  public visitCommand(_inst: CommandInst): Errors {
    return [];
  }

  public visitCommandExpr(inst: CommandExpressionInst): Errors {
    return this.useExprLocals(inst.expression).concat(
      this.resolveExpr(inst.expression));
  }

  public visitUnset(inst: UnsetInst): Errors {
    const error = this.scopeMan.useVariable(inst.identifier);
    return empty(error) ? [] : [error];
  }

  public visitUnlock(inst: UnlockInst): Errors {
    const error = this.scopeMan.useLock(inst.identifier);
    return empty(error) ? [] : [error];
  }

  public visitSet(inst: SetInst): Errors {
    const { set, used } = this.setResolver.resolveExpr(inst.suffix);
    if (empty(set)) {
      const [token] = this.localResolver.resolveExpr(inst.suffix);
      return [new ResolverError(token, `cannot assign to variable ${token.lexeme}`, [])];
    }

    if (!this.lazyGlobalOff) {
      if (empty(this.scopeMan.lookupVariable(set, ScopeType.global))) {
        this.scopeMan.declareVariable(ScopeType.global, set);
      }
    }

    const defineError = this.scopeMan.defineBinding(set);
    const useErrors = this.useExprLocals(inst.value).concat(this.useTokens(used));
    const resolveErrors = this.resolveExpr(inst.value);

    return !empty(defineError)
      ? useErrors.concat(resolveErrors, defineError)
      : useErrors.concat(resolveErrors);
  }

  public visitLazyGlobalInst(inst: LazyGlobalInst): Errors {
    // It is an error if lazy global is not at the start of a file
    if (!this.firstInst) {
      return [
        new ResolverError(inst.lazyGlobal, 'Lazy global was not declared at top of the file', []),
      ];
    }

    this.lazyGlobalOff = inst.onOff.type === TokenType.off;
    return [];
  }

  public visitIf(inst: IfInst): Errors {
    const errors = this.useExprLocals(inst.condition).concat(
      this.resolveExpr(inst.condition),
      this.resolveInst(inst.instruction));

    if (inst.elseInst) {
      return errors.concat(
        this.resolveInst(inst.elseInst));
    }

    return errors;
  }

  public visitElse(inst: ElseInst): Errors {
    return this.resolveInst(inst.instruction);
  }

  public visitUntil(inst: UntilInst): Errors {
    return this.useExprLocals(inst.condition).concat(
      this.resolveExpr(inst.condition),
      this.resolveInst(inst.instruction));
  }

  public visitFrom(inst: FromInst): Errors {
    this.scopeMan.beginScope(inst);

    const resolverErrors = this.resolveInsts(inst.initializer.instructions).concat(
      this.resolveExpr(inst.condition),
      this.resolveInsts(inst.increment.instructions),
      this.resolveInst(inst.instruction));

    const useErrors = this.useExprLocals(inst.condition);
    const scopeErrors = this.scopeMan.endScope();

    return resolverErrors.concat(useErrors, scopeErrors);
  }

  public visitWhen(inst: WhenInst): Errors {
    return this.useExprLocals(inst.condition).concat(
      this.resolveExpr(inst.condition),
      this.resolveInst(inst.instruction));
  }

  public visitReturn(inst: ReturnInst): Errors {
    if (inst.value) {
      return this.useExprLocals(inst.value)
        .concat(this.resolveExpr(inst.value));
    }

    return [];
  }

  // tslint:disable-next-line:variable-name
  public visitBreak(_inst: BreakInst): Errors {
    return [];
  }

  public visitSwitch(inst: SwitchInst): Errors {
    return this.useExprLocals(inst.target)
      .concat(this.resolveExpr(inst.target));
  }

  public visitFor(inst: ForInst): Errors {
    this.scopeMan.beginScope(inst);
    const declareError = this.scopeMan.declareVariable(ScopeType.local, inst.identifier);

    let errors = this.useExprLocals(inst.suffix).concat(
      this.resolveExpr(inst.suffix),
      this.resolveInst(inst.instruction));

    errors = errors.concat(this.scopeMan.endScope());
    if (!empty(declareError)) {
      return errors.concat(declareError);
    }
    return errors;
  }

  public visitOn(inst: OnInst): Errors {
    return this.useExprLocals(inst.suffix).concat(
      this.resolveExpr(inst.suffix),
      this.resolveInst(inst.instruction));
  }

  public visitToggle(inst: ToggleInst): Errors {
    return this.useExprLocals(inst.suffix)
      .concat(this.resolveExpr(inst.suffix));
  }

  public visitWait(inst: WaitInst): Errors {
    return this.useExprLocals(inst.expression)
      .concat(this.resolveExpr(inst.expression));
  }

  public visitLog(inst: LogInst): Errors {
    let useErrors: Errors = [];

    // check target expression
    if (inst.target instanceof LiteralExpr) {
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

  public visitCopy(inst: CopyInst): Errors {
    let useErrors: Errors = [];

    // check from expression
    if (inst.expression instanceof LiteralExpr) {
      switch (inst.expression.token.type) {
        case TokenType.string:
        case TokenType.fileIdentifier:
          // TODO may need check some about path here
          break;
        default:
          useErrors = this.useExprLocals(inst.expression);
      }
    }

    // check the target location
    if (inst.target instanceof LiteralExpr) {
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

  public visitRename(inst: RenameInst): Errors {
    return this.useExprLocals(inst.expression).concat(
      this.useExprLocals(inst.target),
      this.resolveExpr(inst.expression),
      this.resolveExpr(inst.target));
  }

  public visitDelete(inst: DeleteInst): Errors {
    if (empty(inst.target)) {
      return this.useExprLocals(inst.expression).concat(
        this.resolveExpr(inst.expression));
    }

    return this.useExprLocals(inst.expression).concat(
      this.useExprLocals(inst.target),
      this.resolveExpr(inst.expression),
      this.resolveExpr(inst.target));
  }

  public visitRun(inst: RunInst): Errors {
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

  public visitRunPath(inst: RunPathInst): Errors {
    if (empty(inst.args)) {
      return this.useExprLocals(inst.expression)
        .concat(this.resolveExpr(inst.expression));
    }

    return this.useExprLocals(inst.expression).concat(
      this.resolveExpr(inst.expression),
      accumulateErrors(inst.args, this.useExprLocals.bind(this)),
      accumulateErrors(inst.args, this.resolveExpr.bind(this)));
  }

  public visitRunPathOnce(inst: RunPathOnceInst): Errors {
    if (empty(inst.args)) {
      return this.useExprLocals(inst.expression)
        .concat(this.resolveExpr(inst.expression));
    }

    return this.useExprLocals(inst.expression).concat(
      this.resolveExpr(inst.expression),
      accumulateErrors(inst.args, this.useExprLocals.bind(this)),
      accumulateErrors(inst.args, this.resolveExpr.bind(this)));
  }

  public visitCompile(inst: CompileInst): Errors {
    if (empty(inst.target)) {
      return this.useExprLocals(inst.expression)
        .concat(this.resolveExpr(inst.expression));
    }

    return this.useExprLocals(inst.expression).concat(
      this.useExprLocals(inst.target),
      this.resolveExpr(inst.expression),
      this.resolveExpr(inst.target));
  }

  public visitList(inst: ListInst): Errors {
    // list generates new variable when target is used
    if (empty(inst.target)) {
      return [];
    }

    const declareError = this.scopeMan.declareVariable(ScopeType.local, inst.target);
    return !empty(declareError) ? [declareError] : [];
  }

  // tslint:disable-next-line:variable-name
  public visitEmpty(_inst: EmptyInst): Errors {
    return [];
  }

  public visitPrint(inst: PrintInst): Errors {
    return this.useExprLocals(inst.expression)
      .concat(this.resolveExpr(inst.expression));
  }

  /* --------------------------------------------

  Expressions

  ----------------------------------------------*/

  // tslint:disable-next-line:variable-name
  public visitExprInvalid(_expr: InvalidExpr): Errors {
    return [];
  }

  public visitBinary(expr: BinaryExpr): Errors {
    return this.resolveExpr(expr.left).concat(
      this.resolveExpr(expr.right));
  }

  public visitUnary(expr: UnaryExpr): Errors {
    return this.resolveExpr(expr.factor);
  }

  public visitFactor(expr: FactorExpr): Errors {
    return this.resolveExpr(expr.suffix).concat(
      this.resolveExpr(expr.exponent));
  }

  public visitSuffix(expr: SuffixExpr): Errors {
    return this.resolveExpr(expr.suffix).concat(
      this.resolveExpr(expr.trailer));
  }

  public visitCall(expr: CallExpr): Errors {
    // if (!expr.isTrailer) {
    //   if (callee instanceof VariableExpr) {
    //     const func = this.scopeMan.lookupFunction(callee.token, ScopeType.global);
    //     if (empty(func)) {
    //       errors.push(new ResolverError(
    //         callee.token,
    //         `Function ${callee.token.lexeme} may not exist`, []));
    //     }
    //     else {
    //       const max = func.parameters.length;
    //       const min = func.requiredParameters;

    //       if (expr.args.length < min) {
    //         errors.push(new ResolverError(
    //           callee.token,
    //           `Function ${callee.token.lexeme} requires at least ${min} parameters`, []));
    //       }
    //       if (expr.args.length > max) {
    //         errors.push(new ResolverError(
    //           callee.token,
    //           `Function ${callee.token.lexeme} accepts at most ${max} parameters`, []));
    //       }
    //     }
    //   } else {
    //     errors = this.resolveExpr(expr.callee);
    //   }
    // }

    return this.resolveExpr(expr.callee).concat(
      accumulateErrors(expr.args, this.resolveExpr.bind(this)));
  }

  public visitArrayIndex(expr: ArrayIndexExpr): Errors {
    return this.resolveExpr(expr.array);
  }

  public visitArrayBracket(expr: ArrayBracketExpr): Errors {
    return this.resolveExpr(expr.array).concat(
      this.resolveExpr(expr.index));
  }

  public visitDelegate(expr: DelegateExpr): Errors {
    return this.resolveExpr(expr.variable);
  }

  // tslint:disable-next-line:variable-name
  public visitLiteral(_expr: LiteralExpr): Errors {
    return [];
  }

  // tslint:disable-next-line:variable-name
  public visitVariable(_expr: VariableExpr): Errors {
    return [];
  }

  public visitGrouping(expr: GroupingExpr): Errors {
    return this.resolveExpr(expr.expr);
  }

  public visitAnonymousFunction(expr: AnonymousFunctionExpr): Errors {
    this.scopeMan.beginScope(expr);
    const errors = this.resolveInsts(expr.instructions);
    this.scopeMan.endScope();

    return errors;
  }
}

const accumulateErrors = <T>(items: T[], checker: (item: T) => Errors): Errors => {
  return items.reduce(
    (accumulator, item) => accumulator.concat(checker(item)),
    [] as Errors);
};
