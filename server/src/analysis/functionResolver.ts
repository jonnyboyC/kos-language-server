import { IInstVisitor, IExprVisitor, IExpr, IInst, ScopeType } from '../parser/types';
import * as Expr from '../parser/expr';
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
import { SyntaxTree } from '../entities/syntaxTree';
import { KsParameter } from '../entities/parameters';
import { TokenType } from '../entities/tokentypes';
import { mockLogger, mockTracer } from '../utilities/logger';
import { EntityState } from './types';
import { ScopeBuilder } from './scopeBuilder';

// tslint:disable-next-line:prefer-array-literal
export type Errors = Array<ResolverError>;

export class FuncResolver implements IExprVisitor<Errors>, IInstVisitor<Errors> {
  private syntaxTree: SyntaxTree;
  private scopeBuilder: ScopeBuilder;
  private readonly logger: ILogger;
  private readonly tracer: ITracer;

  constructor(
    syntaxTree: SyntaxTree,
    scopeBuilder: ScopeBuilder,
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer) {
    this.syntaxTree = syntaxTree;
    this.scopeBuilder = scopeBuilder;
    this.logger = logger;
    this.tracer = tracer;
  }

  // resolve the sequence of instructions
  public resolve(): Errors {
    try {
      this.scopeBuilder.rewindScope();
      this.scopeBuilder.beginScope(this.syntaxTree);

      const resolveErrors = this.resolveInsts(this.syntaxTree.insts);
      const scopeErrors = this.scopeBuilder.endScope();

      return resolveErrors.concat(scopeErrors);
    } catch (err) {
      this.logger.error(`Error occured in resolver ${err}`);
      this.tracer.log(err);

      return[];
    }
  }

  // resolve the given set of instructions
  public resolveInsts(insts: IInst[]): Errors {
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

  /* --------------------------------------------

  Declarations

  ----------------------------------------------*/

  // check variable declaration
  public visitDeclVariable(decl: DeclVariable): Errors {
    return this.resolveExpr(decl.expression);
  }

  // check lock declaration
  // tslint:disable-next-line:variable-name
  public visitDeclLock(_decl: DeclLock): ResolverError[] {
    return [];
  }

  // check function declaration
  public visitDeclFunction(decl: DeclFunction): ResolverError[] {
    const scopeToken = decl.scope && decl.scope.scope;

    let scopeType: ScopeType;

    // functions are default global at file scope and local everywhere else
    if (empty(scopeToken)) {
      scopeType = this.scopeBuilder.isFileScope()
        ? ScopeType.global
        : ScopeType.local;
    } else {
      switch (scopeToken.type) {
        case TokenType.local:
          scopeType = ScopeType.local;
          break;
        case TokenType.global:
          scopeType = ScopeType.global;
          break;
        default:
          throw new Error('Unexpected scope token encountered. Expected local or global.');
      }
    }

    let returnValue = false;
    const parameterDecls: DeclParameter[] = [];
    for (const inst of decl.instructionBlock.instructions) {

      // get parameters for this function
      if (inst instanceof DeclParameter) {
        parameterDecls.push(inst);
        continue;
      }

      // determine if return exists
      if (inst instanceof ReturnInst) {
        returnValue = true;
      }
    }
    const [parameters, errors] = this.buildParameters(parameterDecls);
    const declareErrors = this.scopeBuilder.declareFunction(
      scopeType, decl.functionIdentifier, parameters, returnValue);
    const instErrors = this.resolveInst(decl.instructionBlock);

    return empty(declareErrors)
      ? instErrors.concat(errors)
      : instErrors.concat(errors, declareErrors);
  }

  private buildParameters(decls: DeclParameter[]): [KsParameter[], Errors] {
    const parameters: KsParameter[] = [];
    const errors: Errors = [];
    let defaulted = false;

    for (const decl of decls) {
      for (const parameter of decl.parameters) {
        if (defaulted) {
          errors.push(new ResolverError(
            parameter.identifier,
            'Normal parameters cannot occur after defaulted parameters', []));
        }
        parameters.push(new KsParameter(parameter.identifier, false, EntityState.declared));
      }

      for (const parameter of decl.defaultParameters) {
        defaulted = true;
        parameters.push(new KsParameter(parameter.identifier, true, EntityState.declared));
      }
    }

    return [parameters, errors];
  }

  // check parameter declaration
  // tslint:disable-next-line:variable-name
  public visitDeclParameter(_decl: DeclParameter): ResolverError[] {
    return [];
  }

  /* --------------------------------------------

  Instructions

  ----------------------------------------------*/

  // tslint:disable-next-line:variable-name
  public visitInstInvalid(_inst: InvalidInst): Errors {
    return [];
  }

  public visitBlock(inst: BlockInst): Errors {
    this.scopeBuilder.beginScope(inst);
    const errors = this.resolveInsts(inst.instructions);
    this.scopeBuilder.endScope();

    return errors;
  }

  public visitExpr(inst: ExprInst): Errors {
    return this.resolveExpr(inst.suffix);
  }

  public visitOnOff(inst: OnOffInst): Errors {
    return this.resolveExpr(inst.suffix);
  }

  // tslint:disable-next-line:variable-name
  public visitCommand(_inst: CommandInst): Errors {
    return [];
  }

  public visitCommandExpr(inst: CommandExpressionInst): Errors {
    return this.resolveExpr(inst.expression);
  }

  // tslint:disable-next-line:variable-name
  public visitUnset(_inst: UnsetInst): Errors {
    return [];
  }

  // tslint:disable-next-line:variable-name
  public visitUnlock(_inst: UnlockInst): Errors {
    return [];
  }

  public visitSet(inst: SetInst): Errors {
    return this.resolveExpr(inst.value);
  }

  // tslint:disable-next-line:variable-name
  public visitLazyGlobalInst(_inst: LazyGlobalInst): Errors {
    return [];
  }

  public visitIf(inst: IfInst): Errors {
    let resolveErrors = this.resolveExpr(inst.condition)
      .concat(this.resolveInst(inst.instruction));

    if (inst.elseInst) {
      resolveErrors = resolveErrors.concat(
        this.resolveInst(inst.elseInst));
    }

    return resolveErrors;
  }

  public visitElse(inst: ElseInst): Errors {
    return this.resolveInst(inst.instruction);
  }

  public visitUntil(inst: UntilInst): Errors {
    return this.resolveExpr(inst.condition).concat(
      this.resolveInst(inst.instruction));
  }

  public visitFrom(inst: FromInst): Errors {
    return this.resolveInsts(inst.initializer.instructions).concat(
      this.resolveExpr(inst.condition),
      this.resolveInsts(inst.increment.instructions),
      this.resolveInst(inst.instruction));
  }

  public visitWhen(inst: WhenInst): Errors {
    return this.resolveExpr(inst.condition)
      .concat(this.resolveInst(inst.instruction));
  }

  public visitReturn(inst: ReturnInst): Errors {
    if (inst.value) {
      return this.resolveExpr(inst.value);
    }

    return [];
  }

  // tslint:disable-next-line:variable-name
  public visitBreak(_inst: BreakInst): Errors {
    return [];
  }

  public visitSwitch(inst: SwitchInst): Errors {
    return this.resolveExpr(inst.target);
  }

  public visitFor(inst: ForInst): Errors {
    return this.resolveExpr(inst.suffix).concat(
      this.resolveInst(inst.instruction));
  }

  public visitOn(inst: OnInst): Errors {
    return this.resolveExpr(inst.suffix).concat(
      this.resolveInst(inst.instruction));
  }

  public visitToggle(inst: ToggleInst): Errors {
    return this.resolveExpr(inst.suffix);
  }

  public visitWait(inst: WaitInst): Errors {
    return this.resolveExpr(inst.expression);
  }

  public visitLog(inst: LogInst): Errors {
    return this.resolveExpr(inst.expression).concat(
      this.resolveExpr(inst.target));
  }

  public visitCopy(inst: CopyInst): Errors {
    return this.resolveExpr(inst.expression).concat(
      this.resolveExpr(inst.target));
  }

  public visitRename(inst: RenameInst): Errors {
    return this.resolveExpr(inst.expression).concat(
      this.resolveExpr(inst.target));
  }

  public visitDelete(inst: DeleteInst): Errors {
    if (empty(inst.target)) {
      return this.resolveExpr(inst.expression);
    }

    return this.resolveExpr(inst.expression).concat(
      this.resolveExpr(inst.target));
  }

  public visitRun(inst: RunInst): Errors {
    if (empty(inst.args)) {
      return [];
    }

    return accumulateErrors(inst.args, this.resolveExpr.bind(this));
  }

  public visitRunPath(inst: RunPathInst): Errors {
    if (empty(inst.args)) {
      return this.resolveExpr(inst.expression);
    }

    return this.resolveExpr(inst.expression).concat(
      accumulateErrors(inst.args, this.resolveExpr.bind(this)));
  }

  public visitRunPathOnce(inst: RunPathOnceInst): Errors {
    if (empty(inst.args)) {
      return this.resolveExpr(inst.expression);
    }

    return this.resolveExpr(inst.expression).concat(
      accumulateErrors(inst.args, this.resolveExpr.bind(this)));
  }

  public visitCompile(inst: CompileInst): Errors {
    if (empty(inst.target)) {
      return this.resolveExpr(inst.expression);
    }

    return this.resolveExpr(inst.expression).concat(
      this.resolveExpr(inst.target));
  }

  // tslint:disable-next-line:variable-name
  public visitList(_inst: ListInst): Errors {
    return [];
  }

  // tslint:disable-next-line:variable-name
  public visitEmpty(_inst: EmptyInst): Errors {
    return [];
  }

  public visitPrint(inst: PrintInst): Errors {
    return this.resolveExpr(inst.expression);
  }

  /* --------------------------------------------

  Expressions

  ----------------------------------------------*/

  // tslint:disable-next-line:variable-name
  public visitExprInvalid(_expr: Expr.Invalid): Errors {
    return [];
  }

  public visitBinary(expr: Expr.Binary): Errors {
    return this.resolveExpr(expr.left)
      .concat(this.resolveExpr(expr.right));
  }

  public visitUnary(expr: Expr.Unary): Errors {
    return this.resolveExpr(expr.factor);
  }

  public visitFactor(expr: Expr.Factor): Errors {
    return this.resolveExpr(expr.suffix)
      .concat(this.resolveExpr(expr.exponent));
  }

  public visitSuffix(expr: Expr.Suffix): Errors {
    return this.resolveExpr(expr.suffix)
      .concat(this.resolveExpr(expr.trailer));
  }

  public visitCall(expr: Expr.Call): Errors {
    return this.resolveExpr(expr.callee)
      .concat(accumulateErrors(expr.args, this.resolveExpr.bind(this)));
  }

  public visitArrayIndex(expr: Expr.ArrayIndex): Errors {
    return this.resolveExpr(expr.array);
  }

  public visitArrayBracket(expr: Expr.ArrayBracket): Errors {
    return this.resolveExpr(expr.array)
      .concat(this.resolveExpr(expr.index));
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
    return this.resolveInsts(expr.instructions);
  }
}

const accumulateErrors = <T>(items: T[], checker: (item: T) => Errors): Errors => {
  return items.reduce(
    (accumulator, item) => accumulator.concat(checker(item)),
    [] as Errors);
};
