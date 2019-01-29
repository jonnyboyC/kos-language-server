import { IExprVisitor, IInstVisitor, IInst, IExpr } from '../parser/types';
import {
  InvalidExpr, BinaryExpr,
  UnaryExpr, FactorExpr, SuffixExpr,
  CallExpr, ArrayIndexExpr, ArrayBracketExpr,
  DelegateExpr, LiteralExpr, VariableExpr,
  GroupingExpr, AnonymousFunctionExpr,
} from '../parser/expr';
import { ITypeError, ITypeResult } from './types';
import { DeclVariable, DeclLock, DeclFunction, DeclParameter } from '../parser/declare';
import { InvalidInst, BlockInst, ExprInst, OnOffInst,
  CommandInst, CommandExpressionInst, UnsetInst,
  UnlockInst, SetInst, LazyGlobalInst, IfInst,
  ElseInst, UntilInst, FromInst, WhenInst,
  ReturnInst, BreakInst, SwitchInst, ForInst,
  OnInst, ToggleInst, WaitInst, LogInst, CopyInst,
  RenameInst, DeleteInst, RunInst, RunPathInst,
  RunPathOnceInst, CompileInst, ListInst,
  EmptyInst, PrintInst,
} from '../parser/inst';
import { mockLogger, mockTracer } from '../utilities/logger';
import { SyntaxTree } from '../entities/syntaxTree';
import { ScopeManager } from '../analysis/scopeManager';
import { empty } from '../utilities/typeGuards';
import { createFunctionType } from './types/functions/function';
import { IType } from './types/types';
import { structureType } from './types/structure';
import { voidType } from './types/void';
import { coerce } from './coerce';
import { booleanType, stringType, scalarType, integarType, doubleType } from './types/primitives';
import { KsTypeError } from './typeError';
import { iterator } from '../utilities/constants';
import { TokenType } from '../entities/tokentypes';

type TypeErrors = ITypeError[];

export class TypeChecker implements IExprVisitor<ITypeResult>, IInstVisitor<TypeErrors> {
  private readonly logger: ILogger;
  private readonly tracer: ITracer;
  private readonly syntaxTree: SyntaxTree;
  private readonly scopeManager: ScopeManager;

  constructor(
    syntaxTree: SyntaxTree,
    scopeManager: ScopeManager,
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer) {
    this.syntaxTree = syntaxTree;
    this.scopeManager = scopeManager;
    this.logger = logger;
    this.tracer = tracer;
  }

  public check() {
    // resolve the sequence of instructions
    try {
      return this.checkInsts(this.syntaxTree.insts);
    } catch (err) {
      this.logger.error(`Error occured in resolver ${err}`);
      this.tracer.log(err);

      return [];
    }
  }

  // check all collection of instructions
  private checkInsts(insts: IInst[]): TypeErrors {
    return accumulateErrors(insts, this.checkInst.bind(this));
  }

  // check for an instruction
  private checkInst(inst: IInst): TypeErrors {
    return inst.accept(this);
  }

  // check for an expression
  private checkExpr(expr: IExpr): ITypeResult {
    return expr.accept(this);
  }

  // visit declare variable
  visitDeclVariable(decl: DeclVariable): TypeErrors {
    const result = this.checkExpr(decl.expression);
    this.scopeManager.setType(decl.identifier, decl.identifier.lexeme, result.type);
    return result.errors;
  }

  // visit declare lock
  visitDeclLock(decl: DeclLock): TypeErrors {
    const result = this.checkExpr(decl.value);
    this.scopeManager.setType(decl.identifier, decl.identifier.lexeme, result.type);
    return result.errors;
  }

  // visit declare function
  visitDeclFunction(decl: DeclFunction): TypeErrors {
    const funcTracker = this.scopeManager
      .scopedFunctionTracker(decl.start, decl.functionIdentifier.lexeme);

    // TODO may need to report if we can't find function tracker
    if (!empty(funcTracker)) {
      const { entity } = funcTracker.declared;
      const paramsTypes: IType[] = [];
      // tslint:disable-next-line:no-increment-decrement
      for (let i = 0; i < entity.parameters.length; i++) {
        paramsTypes.push(structureType);
      }
      const returnType = entity.returnValue ? structureType : voidType;

      const funcType = createFunctionType(
        funcTracker.declared.entity.name.lexeme, returnType, ...paramsTypes);

      this.scopeManager.setType(entity.name, entity.name.lexeme, funcType);
    }

    const errors = this.checkInst(decl.instructionBlock);
    return errors;
  }

  // visit declare parameter
  visitDeclParameter(decl: DeclParameter): TypeErrors {
    let errors: TypeErrors = [];

    // loop over defaulted parameters
    // TODO currently assume paramarter is default type
    for (const defaulted of decl.defaultParameters) {
      const valueResult = this.checkExpr(defaulted.value);
      this.scopeManager.setType(
        defaulted.identifier,
        defaulted.identifier.lexeme,
        valueResult.type,
      );

      errors = errors.concat(valueResult.errors);
    }

    // loop over normal parameters
    for (const parameter of decl.parameters) {
      this.scopeManager.setType(
        parameter.identifier,
        parameter.identifier.lexeme,
        structureType,
      );
    }

    return errors;
  }
  // tslint:disable-next-line:variable-name
  public visitInstInvalid(_inst: InvalidInst): TypeErrors {
    return [];
  }
  public visitBlock(inst: BlockInst): TypeErrors {
    return accumulateErrors(inst.instructions, this.checkInst.bind(this));
  }
  public visitExpr(inst: ExprInst): TypeErrors {
    const result = this.checkExpr(inst.suffix);
    return result.errors;
  }
  public visitOnOff(inst: OnOffInst): TypeErrors {
    const result = this.checkExpr(inst.suffix);
    return result.errors;
  }
  // tslint:disable-next-line:variable-name
  public visitCommand(_inst: CommandInst): TypeErrors {
    return [];
  }
  public visitCommandExpr(inst: CommandExpressionInst): TypeErrors {
    const result = this.checkExpr(inst.expression);
    return result.errors;
  }
  // tslint:disable-next-line:variable-name
  public visitUnset(_inst: UnsetInst): TypeErrors {
    return [];
  }
  // tslint:disable-next-line:variable-name
  public visitUnlock(_inst: UnlockInst): TypeErrors {
    return [];
  }
  public visitSet(inst: SetInst): TypeErrors {
    // const result = this.checkExpr(inst.value);
    if (inst) { }
    return [];
  }
  // tslint:disable-next-line:variable-name
  public visitLazyGlobalInst(_inst: LazyGlobalInst): TypeErrors {
    return [];
  }

  // visit if instruction
  public visitIf(inst: IfInst): TypeErrors {
    const conditionResult = this.checkExpr(inst.condition);
    const errors: TypeErrors = conditionResult.errors;

    if (!coerce(conditionResult.type, booleanType)) {
      errors.push(new KsTypeError(
        inst.condition, 'Condition may not able to be  be coerced into boolean type', []));
    }

    const moreErrors = empty(inst.elseInst)
      ? [this.checkInst(inst.instruction)]
      : [this.checkInst(inst.instruction), this.checkInst(inst.elseInst)];
    return errors.concat(...moreErrors);
  }

  // visit else instruction
  public visitElse(inst: ElseInst): TypeErrors {
    return this.checkInst(inst.instruction);
  }

  // visit until instruction
  public visitUntil(inst: UntilInst): TypeErrors {
    const conditionResult = this.checkExpr(inst.condition);
    const errors = conditionResult.errors;

    if (!coerce(conditionResult.type, booleanType)) {
      errors.push(new KsTypeError(
        inst.condition, 'Condition may not able to be  be coerced into boolean type', []));
    }

    return errors.concat(this.checkInst(inst.instruction));
  }

  // visit from loop
  public visitFrom(inst: FromInst): TypeErrors {
    let errors: TypeErrors = this.checkInst(inst.initializer);
    const conditionResult = this.checkExpr(inst.condition);
    errors = errors.concat(conditionResult.errors);

    if (!coerce(conditionResult.type, booleanType)) {
      errors.push(new KsTypeError(
        inst.condition, 'Condition may not able to be coerced into boolean type', []));
    }
    return errors.concat(
      this.checkInst(inst.increment),
      this.checkInst(inst.instruction));
  }

  // vist when statment
  public visitWhen(inst: WhenInst): TypeErrors {
    const conditionResult = this.checkExpr(inst.condition);
    const errors = conditionResult.errors;

    if (!coerce(conditionResult.type, booleanType)) {
      errors.push(new KsTypeError(
        inst.condition, 'Condition may not able to be coerced into boolean type', []));
    }

    return errors.concat(this.checkInst(inst.instruction));
  }

  // visit return
  // tslint:disable-next-line:variable-name
  public visitReturn(_inst: ReturnInst): TypeErrors {
    // TODO may need this function signiture
    return [];
  }

  // visit break
  // tslint:disable-next-line:variable-name
  public visitBreak(_inst: BreakInst): TypeErrors {
    return [];
  }

  // visit switch
  public visitSwitch(inst: SwitchInst): TypeErrors {
    const result = this.checkExpr(inst.target);
    let errors = result.errors;

    if (coerce(result.type, stringType)) {
      errors = errors.concat(new KsTypeError(
        inst.target, 'May not be a string identifer for volume', []));
    }

    return errors;
  }
  public visitFor(inst: ForInst): TypeErrors {
    const result = this.checkExpr(inst.suffix);
    let errors: TypeErrors = [];

    if (!result.type.suffixes.has(iterator)) {
      errors = errors.concat(new KsTypeError(
        inst.suffix, 'May not be a valid enumerable type', []));
    }

    // TODO may be able to detect if type is really pure and not mixed
    this.scopeManager.setType(inst.identifier, inst.identifier.lexeme, structureType);
    return errors.concat(this.checkInst(inst.instruction));
  }
  public visitOn(inst: OnInst): TypeErrors {
    const result = this.checkExpr(inst.suffix);
    let errors: TypeErrors = [];

    if (coerce(result.type, booleanType)) {
      errors = errors.concat(new KsTypeError(
        inst.suffix, 'Condition may not able to be coerced into boolean type', []));
    }

    return errors.concat(this.checkInst(inst.instruction));
  }
  public visitToggle(inst: ToggleInst): TypeErrors {
    const result = this.checkExpr(inst.suffix);
    return result.errors;
  }
  public visitWait(inst: WaitInst): TypeErrors {
    const result = this.checkExpr(inst.expression);
    let errors: TypeErrors = result.errors;

    if (empty(inst.until)) {
      if (!coerce(result.type, scalarType)) {
        errors = errors.concat(new KsTypeError(
          inst.expression, 'Wait requires a scalar type. ' +
          'This may not able to be coerced into scalar type',
          []));
      }
    } else {
      if (!coerce(result.type, booleanType)) {
        errors = errors.concat(new KsTypeError(
          inst.expression, 'Wait requires a boolean type. ' +
          'This may not able to be coerced into boolean type',
          []));
      }
    }

    return errors;
  }
  public visitLog(inst: LogInst): TypeErrors {
    const exprResult = this.checkExpr(inst.expression);
    let errors: TypeErrors = exprResult.errors;

    if (!coerce(exprResult.type, stringType)) {
      errors = errors.concat(new KsTypeError(
        inst.expression, 'Can only log a string type. ' +
        'This may not able to be coerced into string type',
        []));
    }
    const logResult = this.checkExpr(inst.target);
    errors = errors.concat(logResult.errors);

    if (!coerce(exprResult.type, stringType)) {
      errors = errors.concat(new KsTypeError(
        inst.expression, 'Can only log to a path. ',
        []));
    }

    return errors;
  }
  public visitCopy(inst: CopyInst): TypeErrors {
    if (inst) { }
    return [];
  }
  public visitRename(inst: RenameInst): TypeErrors {
    if (inst) { }
    return [];
  }
  public visitDelete(inst: DeleteInst): TypeErrors {
    if (inst) { }
    return [];
  }
  public visitRun(inst: RunInst): TypeErrors {
    if (inst) { }
    return [];
  }
  public visitRunPath(inst: RunPathInst): TypeErrors {
    if (inst) { }
    return [];
  }
  public visitRunPathOnce(inst: RunPathOnceInst): TypeErrors {
    if (inst) { }
    return [];
  }
  public visitCompile(inst: CompileInst): TypeErrors {
    if (inst) { }
    return [];
  }
  public visitList(inst: ListInst): TypeErrors {
    if (inst) { }
    return [];
  }

  // visit empty instruction
  // tslint:disable-next-line:variable-name
  public visitEmpty(_inst: EmptyInst): TypeErrors {
    return [];
  }

  // vist print instruction
  public visitPrint(inst: PrintInst): TypeErrors {
    const result = this.checkExpr(inst.expression);
    const errors = result.errors;

    if (!coerce(result.type, structureType)) {
      errors.push(new KsTypeError(
        inst.expression, 'Cannot print a function, can only print structures', []));
    }

    return errors;
  }

  // visit invalid expression
  // tslint:disable-next-line:variable-name
  public visitExprInvalid(_expr: InvalidExpr): ITypeResult {
    return { type: structureType, errors: [] };
  }
  public visitBinary(expr: BinaryExpr): ITypeResult {
    switch (expr.operator.type) {
      case TokenType.add:
      case TokenType.minus:
    }

    if (expr) { }
    return { type: structureType, errors: [] };
  }
  public visitUnary(expr: UnaryExpr): ITypeResult {
    const result = this.checkExpr(expr.factor);
    const errors: TypeErrors = result.errors;
    let finalType: Maybe<IType> = undefined;

    switch (expr.operator.type) {
      case TokenType.plus:
      case TokenType.minus:
        // TODO check if this is true
        if (coerce(result.type, scalarType)) {
          errors.push(new KsTypeError(
            expr.factor, '+/- only valid for a scalar type. ' +
            'This may not able to be coerced into scalar type',
            []));
        }
        finalType = scalarType;
        break;
      case TokenType.not:
        if (coerce(result.type, booleanType)) {
          errors.push(new KsTypeError(
            expr.factor, 'Can only "not" a boolean type. ' +
            'This may not able to be coerced into string type',
            []));
        }
        finalType = booleanType;
        break;
      case TokenType.defined:
        finalType = booleanType;
        break;
      default:
        throw new Error(`Invalid Token ${expr.operator.typeString} for unary operator.`);
    }

    return { errors , type: finalType };
  }
  public visitFactor(expr: FactorExpr): ITypeResult {
    if (expr) { }
    return { type: structureType, errors: [] };
  }
  public visitSuffix(expr: SuffixExpr): ITypeResult {
    if (expr) { }
    return { type: structureType, errors: [] };
  }
  public visitCall(expr: CallExpr): ITypeResult {
    if (expr) { }
    return { type: structureType, errors: [] };
  }
  public visitArrayIndex(expr: ArrayIndexExpr): ITypeResult {
    if (expr) { }
    return { type: structureType, errors: [] };
  }
  public visitArrayBracket(expr: ArrayBracketExpr): ITypeResult {
    if (expr) { }
    return { type: structureType, errors: [] };
  }
  public visitDelegate(expr: DelegateExpr): ITypeResult {
    if (expr) { }
    return { type: structureType, errors: [] };
  }

  // visit literal expression
  public visitLiteral(expr: LiteralExpr): ITypeResult {
    switch (expr.token.type) {
      case TokenType.true:
      case TokenType.false:
        return { type: booleanType, errors: [] };
      case TokenType.string:
        return { type: stringType, errors: [] };
      case TokenType.fileIdentifier:
        return { type: stringType, errors: [] };
      case TokenType.integer:
        return { type: integarType, errors: [] };
      case TokenType.double:
        return { type: doubleType, errors: [] };
      default:
        throw new Error('Unexpected Literally token type encountered');
    }
  }

  // visit variable expression
  public visitVariable(expr: VariableExpr): ITypeResult {
    const type = this.scopeManager.getType(expr.token, expr.token.lexeme);
    return { type: empty(type) ? structureType : type, errors: [] };
  }
  public visitGrouping(expr: GroupingExpr): ITypeResult {
    if (expr) { }
    return { type: structureType, errors: [] };
  }
  public visitAnonymousFunction(expr: AnonymousFunctionExpr): ITypeResult {
    if (expr) { }
    return { type: structureType, errors: [] };
  }
}

const accumulateErrors = <T>(items: T[], checker: (item: T) => TypeErrors): TypeErrors => {
  return items.reduce(
    (accumulator, item) => accumulator.concat(checker(item)),
    [] as TypeErrors);
};
