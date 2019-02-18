import { IInstVisitor, IExprVisitor, IInst, ScopeType, IExpr } from '../parser/types';
import * as Expr from '../parser/expr';
import * as Inst from '../parser/inst';
import { ResolverError } from './resolverError';
import { Var, Lock, Func, Param } from '../parser/declare';
import { empty } from '../utilities/typeGuards';
import { Script } from '../entities/script';
import { KsParameter } from '../entities/parameters';
import { TokenType } from '../entities/tokentypes';
import { mockLogger, mockTracer } from '../utilities/logger';
import { EntityState } from './types';
import { ScopeBuilder } from './scopeBuilder';

// tslint:disable-next-line:prefer-array-literal
export type Errors = Array<ResolverError>;

export class FuncResolver implements IExprVisitor<Errors>, IInstVisitor<Errors> {
  private syntaxTree: Script;
  private scopeBuilder: ScopeBuilder;
  private readonly logger: ILogger;
  private readonly tracer: ITracer;

  constructor(
    syntaxTree: Script,
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
  public visitDeclVariable(decl: Var): Errors {
    return this.resolveExpr(decl.expression);
  }

  // check lock declaration
  // tslint:disable-next-line:variable-name
  public visitDeclLock(_decl: Lock): ResolverError[] {
    return [];
  }

  // check function declaration
  public visitDeclFunction(decl: Func): ResolverError[] {
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
    const parameterDecls: Param[] = [];
    for (const inst of decl.instructionBlock.instructions) {

      // get parameters for this function
      if (inst instanceof Param) {
        parameterDecls.push(inst);
        continue;
      }

      // determine if return exists
      if (inst instanceof Inst.Return) {
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

  private buildParameters(decls: Param[]): [KsParameter[], Errors] {
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
  public visitDeclParameter(_decl: Param): ResolverError[] {
    return [];
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
    return this.resolveExpr(inst.suffix);
  }

  public visitOnOff(inst: Inst.OnOff): Errors {
    return this.resolveExpr(inst.suffix);
  }

  // tslint:disable-next-line:variable-name
  public visitCommand(_inst: Inst.Command): Errors {
    return [];
  }

  public visitCommandExpr(inst: Inst.CommandExpr): Errors {
    return this.resolveExpr(inst.expression);
  }

  // tslint:disable-next-line:variable-name
  public visitUnset(_inst: Inst.Unset): Errors {
    return [];
  }

  // tslint:disable-next-line:variable-name
  public visitUnlock(_inst: Inst.Unlock): Errors {
    return [];
  }

  public visitSet(inst: Inst.Set): Errors {
    return this.resolveExpr(inst.value);
  }

  // tslint:disable-next-line:variable-name
  public visitLazyGlobalInst(_inst: Inst.LazyGlobal): Errors {
    return [];
  }

  public visitIf(inst: Inst.If): Errors {
    let resolveErrors = this.resolveExpr(inst.condition)
      .concat(this.resolveInst(inst.instruction));

    if (inst.elseInst) {
      resolveErrors = resolveErrors.concat(
        this.resolveInst(inst.elseInst));
    }

    return resolveErrors;
  }

  public visitElse(inst: Inst.Else): Errors {
    return this.resolveInst(inst.instruction);
  }

  public visitUntil(inst: Inst.Until): Errors {
    return this.resolveExpr(inst.condition).concat(
      this.resolveInst(inst.instruction));
  }

  public visitFrom(inst: Inst.From): Errors {
    return this.resolveInsts(inst.initializer.instructions).concat(
      this.resolveExpr(inst.condition),
      this.resolveInsts(inst.increment.instructions),
      this.resolveInst(inst.instruction));
  }

  public visitWhen(inst: Inst.When): Errors {
    return this.resolveExpr(inst.condition)
      .concat(this.resolveInst(inst.instruction));
  }

  public visitReturn(inst: Inst.Return): Errors {
    if (inst.value) {
      return this.resolveExpr(inst.value);
    }

    return [];
  }

  // tslint:disable-next-line:variable-name
  public visitBreak(_inst: Inst.Break): Errors {
    return [];
  }

  public visitSwitch(inst: Inst.Switch): Errors {
    return this.resolveExpr(inst.target);
  }

  public visitFor(inst: Inst.For): Errors {
    return this.resolveExpr(inst.suffix).concat(
      this.resolveInst(inst.instruction));
  }

  public visitOn(inst: Inst.On): Errors {
    return this.resolveExpr(inst.suffix).concat(
      this.resolveInst(inst.instruction));
  }

  public visitToggle(inst: Inst.Toggle): Errors {
    return this.resolveExpr(inst.suffix);
  }

  public visitWait(inst: Inst.Wait): Errors {
    return this.resolveExpr(inst.expression);
  }

  public visitLog(inst: Inst.Log): Errors {
    return this.resolveExpr(inst.expression).concat(
      this.resolveExpr(inst.target));
  }

  public visitCopy(inst: Inst.Copy): Errors {
    return this.resolveExpr(inst.source).concat(
      this.resolveExpr(inst.target));
  }

  public visitRename(inst: Inst.Rename): Errors {
    return this.resolveExpr(inst.source).concat(
      this.resolveExpr(inst.target));
  }

  public visitDelete(inst: Inst.Delete): Errors {
    if (empty(inst.target)) {
      return this.resolveExpr(inst.expression);
    }

    return this.resolveExpr(inst.expression).concat(
      this.resolveExpr(inst.target));
  }

  public visitRun(inst: Inst.Run): Errors {
    if (empty(inst.args)) {
      return [];
    }

    return accumulateErrors(inst.args, this.resolveExpr.bind(this));
  }

  public visitRunPath(inst: Inst.RunPath): Errors {
    if (empty(inst.args)) {
      return this.resolveExpr(inst.expression);
    }

    return this.resolveExpr(inst.expression).concat(
      accumulateErrors(inst.args, this.resolveExpr.bind(this)));
  }

  public visitRunPathOnce(inst: Inst.RunPathOnce): Errors {
    if (empty(inst.args)) {
      return this.resolveExpr(inst.expression);
    }

    return this.resolveExpr(inst.expression).concat(
      accumulateErrors(inst.args, this.resolveExpr.bind(this)));
  }

  public visitCompile(inst: Inst.Compile): Errors {
    if (empty(inst.target)) {
      return this.resolveExpr(inst.expression);
    }

    return this.resolveExpr(inst.expression).concat(
      this.resolveExpr(inst.target));
  }

  // tslint:disable-next-line:variable-name
  public visitList(_inst: Inst.List): Errors {
    return [];
  }

  // tslint:disable-next-line:variable-name
  public visitEmpty(_inst: Inst.Empty): Errors {
    return [];
  }

  public visitPrint(inst: Inst.Print): Errors {
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
    return this.resolveExpr(expr.base)
      .concat(this.resolveExpr(expr.trailer));
  }

  public visitCall(expr: Expr.Call): Errors {
    return this.resolveExpr(expr.base)
      .concat(accumulateErrors(expr.args, this.resolveExpr.bind(this)));
  }

  public visitArrayIndex(expr: Expr.ArrayIndex): Errors {
    return this.resolveExpr(expr.base);
  }

  public visitArrayBracket(expr: Expr.ArrayBracket): Errors {
    return this.resolveExpr(expr.base)
      .concat(this.resolveExpr(expr.index));
  }

  public visitDelegate(expr: Expr.Delegate): Errors {
    return this.resolveExpr(expr.base);
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
