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
import { ScopeManager } from './scopeManager';
import { ParameterState } from './types';
import { SyntaxTree } from '../entities/syntaxTree';
import { KsParameter } from '../entities/parameters';

// tslint:disable-next-line:prefer-array-literal
export type Errors = Array<ResolverError>;

export class FuncResolver implements IExprVisitor<Errors>, IInstVisitor<Errors> {
  private syntaxTree: SyntaxTree;
  private scopeMan: ScopeManager;

  constructor() {
    this.syntaxTree = new SyntaxTree([]);
    this.scopeMan = new ScopeManager();
  }

  // resolve the sequence of instructions
  public resolve(syntaxTree: SyntaxTree, scopeMan: ScopeManager): Errors {
    this.setSyntaxTree(syntaxTree, scopeMan);
    this.scopeMan.beginScope(this.syntaxTree);

    const resolveErrors = this.resolveInsts(this.syntaxTree.insts);
    const scopeErrors = this.scopeMan.endScope();

    return resolveErrors.concat(scopeErrors);
  }

  // set the syntax tree and scope manager
  private setSyntaxTree(syntaxTree: SyntaxTree, scopeMan: ScopeManager): void {
    this.syntaxTree = syntaxTree;
    this.scopeMan = scopeMan;
    this.scopeMan.rewindScope();
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
    let scopeType = decl.scope && decl.scope.type;

    // functions are default global at file scope and local everywhere else
    if (empty(scopeType)) {
      scopeType = this.scopeMan.isFileScope()
        ? ScopeType.global
        : ScopeType.local;
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
    const declareErrors = this.scopeMan.declareFunction(
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
        parameters.push(new KsParameter(parameter.identifier, false, ParameterState.declared));
      }

      for (const parameter of decl.defaultParameters) {
        defaulted = true;
        parameters.push(new KsParameter(parameter.identifier, true, ParameterState.declared));
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
    this.scopeMan.beginScope(inst);
    const errors = this.resolveInsts(inst.instructions);
    this.scopeMan.endScope();

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
  public visitExprInvalid(_expr: InvalidExpr): Errors {
    return [];
  }

  public visitBinary(expr: BinaryExpr): Errors {
    return this.resolveExpr(expr.left)
      .concat(this.resolveExpr(expr.right));
  }

  public visitUnary(expr: UnaryExpr): Errors {
    return this.resolveExpr(expr.factor);
  }

  public visitFactor(expr: FactorExpr): Errors {
    return this.resolveExpr(expr.suffix)
      .concat(this.resolveExpr(expr.exponent));
  }

  public visitSuffix(expr: SuffixExpr): Errors {
    return this.resolveExpr(expr.suffix)
      .concat(this.resolveExpr(expr.trailer));
  }

  public visitCall(expr: CallExpr): Errors {
    return this.resolveExpr(expr.callee)
      .concat(accumulateErrors(expr.args, this.resolveExpr.bind(this)));
  }

  public visitArrayIndex(expr: ArrayIndexExpr): Errors {
    return this.resolveExpr(expr.array);
  }

  public visitArrayBracket(expr: ArrayBracketExpr): Errors {
    return this.resolveExpr(expr.array)
      .concat(this.resolveExpr(expr.index));
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
    return this.resolveInsts(expr.instruction);
  }
}

const accumulateErrors = <T>(items: T[], checker: (item: T) => Errors): Errors => {
  return items.reduce(
    (accumulator, item) => accumulator.concat(checker(item)),
    [] as Errors);
};
