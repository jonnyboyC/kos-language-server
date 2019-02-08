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
import {
  IArgumentType, IType,
  IBasicType, IVariadicType, Operator, SuffixCallType,
} from './types/types';
import { structureType } from './types/structure';
import { voidType } from './types/void';
import { coerce } from './coerce';
import { booleanType, stringType, scalarType, integarType, doubleType } from './types/primitives';
import { KsTypeError } from './typeError';
import { iterator } from '../utilities/constants';
import { TokenType } from '../entities/tokentypes';
import { nodeType } from './types/node';
import { createFunctionType } from './types/ksType';
import { userListType } from './types/collections/list';
import { lexiconType } from './types/collections/lexicon';
import { zip } from '../utilities/arrayUtilities';
import { isSubType, hasOperator, getSuffix } from './types/typeUitlities';

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
      const paramsTypes: IArgumentType[] = [];
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
    const errors: TypeErrors = result.errors;

    switch (inst.command.type) {
      case TokenType.add:
      case TokenType.remove:
        if (!coerce(result.type, nodeType)) {
          const command = inst.command.type === TokenType.add
            ? 'add'
            : 'remove';

          errors.push(new KsTypeError(
            inst.expression, `${command} expected a node.` +
            ' Node may not able to be  be coerced into node type',
            []));
        }
        break;
      case TokenType.edit:
        if (!coerce(result.type, nodeType)) {
          errors.push(new KsTypeError(
            inst.expression, 'Path may not be coerced into string type', []));
        }
        break;
      default:
        throw new Error('Unexpected token type found in command expression');
    }

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
    const result = this.checkExpr(inst.value);
    if (inst.suffix instanceof VariableExpr) {
      this.scopeManager.setType(inst.suffix.token, inst.suffix.token.lexeme, result.type);
    } else {
      // TODO suffix case
    }
    return result.errors;
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
        inst.condition, 'Condition may not able to be coerced into boolean type', []));
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
  public visitReturn(inst: ReturnInst): TypeErrors {
    const errors: TypeErrors = [];
    if (!empty(inst.value)) {

    }

    return errors;
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

    const { type } = result;
    if (type.tag !== 'type' || !type.suffixes.has(iterator)) {
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
    const rightResult = this.checkExpr(expr.right);
    const leftResult = this.checkExpr(expr.left);

    switch (expr.operator.type) {
      case TokenType.minus:
        return this.checkOperator(expr, leftResult, rightResult, Operator.subtract);
      case TokenType.multi:
        return this.checkOperator(expr, leftResult, rightResult, Operator.multiply);
      case TokenType.div:
        return this.checkOperator(expr, leftResult, rightResult, Operator.divide);
      case TokenType.plus:
        return this.checkOperator(expr, leftResult, rightResult, Operator.plus);
      case TokenType.less:
        return this.checkOperator(expr, leftResult, rightResult, Operator.lessThan);
      case TokenType.lessEqual:
        return this.checkOperator(expr, leftResult, rightResult, Operator.lessThanEqual);
      case TokenType.greater:
        return this.checkOperator(expr, leftResult, rightResult, Operator.greaterThan);
      case TokenType.greaterEqual:
        return this.checkOperator(expr, leftResult, rightResult, Operator.greaterThanEqual);
      case TokenType.and:
      case TokenType.or:
        const errors = leftResult.errors.concat(rightResult.errors);
        if (!isSubType(leftResult.type, booleanType) || !isSubType(leftResult.type, booleanType)) {
          errors.push(new KsTypeError(
            expr,
            '"and" and "or" require boolean types. May not be able to coerce one or other', []));
        }
        return { errors, type: booleanType };
      case TokenType.equal:
        return this.checkOperator(expr, leftResult, rightResult, Operator.equal);
      case TokenType.notEqual:
        return this.checkOperator(expr, leftResult, rightResult, Operator.notEqual);
    }

    throw new Error(
      `Unexpected token ${expr.operator.typeString} type encountered in binary expression`);
  }

  private checkOperator(
    expr: IExpr,
    leftResult: ITypeResult,
    rightResult: ITypeResult,
    operator: Operator): ITypeResult {

    const leftType = leftResult.type;
    const rightType = rightResult.type;
    const errors = leftResult.errors.concat(rightResult.errors);
    let calcType: Maybe<IArgumentType> = undefined;

    // TODO could be more efficient
    if (isSubType(leftType, scalarType)
      && isSubType(rightType, scalarType)) {
      calcType = scalarType;
    } else if (isSubType(leftType, stringType)
      || isSubType(rightType, stringType)) {
      calcType = stringType;
    } else if (isSubType(leftType, booleanType)
      || isSubType(rightType, booleanType)) {
      calcType = booleanType;
    } else {
      const leftOp = hasOperator(leftType, operator);
      const rightOp = hasOperator(rightType, operator);

      if (empty(leftOp) && empty(rightOp)) {
        return {
          type: structureType,
          errors: errors.concat(
            new KsTypeError(expr, `${leftType.name} nor ${rightType.name} have TODO operator`, [])),
        };
      }

      if (!empty(leftOp)) {
        return { errors, type: leftOp };
      }
      if (!empty(rightOp)) {
        return { errors, type: rightOp };
      }

      return { errors, type: structureType };
    }

    const returnType = calcType.operators.get(operator);
    if (empty(returnType)) {
      return {
        type: structureType,
        errors: errors.concat(
          new KsTypeError(expr, `${calcType.name} type does not have TODO operator`, [])),
      };
    }

    return { errors, type: returnType };
  }

  public visitUnary(expr: UnaryExpr): ITypeResult {
    const result = this.checkExpr(expr.factor);
    const errors: TypeErrors = result.errors;
    let finalType: Maybe<IArgumentType> = undefined;

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
    const suffixResult = this.checkExpr(expr.suffix);
    const exponentResult = this.checkExpr(expr.exponent);
    const errors = suffixResult.errors.concat(exponentResult.errors);

    if (coerce(suffixResult.type, scalarType)) {
      errors.push(new KsTypeError(
        expr.suffix, 'Can only use scalars as base of power' +
        'This may not able to be coerced into scalar type',
        []));
    }

    if (coerce(exponentResult.type, scalarType)) {
      errors.push(new KsTypeError(
        expr.exponent, 'Can only use scalars as exponent of power' +
        'This may not able to be coerced into scalar type',
        []));
    }

    return {  errors, type: scalarType };
  }
  public visitSuffix(expr: SuffixExpr): ITypeResult {
    if (expr.isSuffix) {
      // debugger;
    }

    const result = this.checkExpr(expr.suffix);

    if (result.type.tag === 'function') {
      return this.errors(
        new KsTypeError(expr, 'found function type', []),
        ...result.errors,
      );
    }

    const { type, errors } = this.visitSuffixTrailer(result.type, expr.trailer);
    return { type, errors: errors.concat(result.errors) };
  }
  private visitSuffixTrailer(type: IArgumentType, expr: IExpr): ITypeResult {
    if (expr instanceof VariableExpr) {
      return this.visitVariableTrailer(type, expr, SuffixCallType.get);
    }

    if (expr instanceof ArrayBracketExpr ||
      expr instanceof ArrayIndexExpr ||
      expr instanceof CallExpr) {
      return this.visitSuffixTermTrailer(type, expr, SuffixCallType.get);
    }

    throw new Error('Invalid suffix trailer');
  }

  private visitVariableTrailer(
    type: IArgumentType,
    expr: VariableExpr,
    callType: SuffixCallType): ITypeResult {
    const suffix = getSuffix(type, expr.token.lexeme);

    // may need to pass sommething in about if we're in get set context
    if (empty(suffix))  {
      return this.errors(
        new KsTypeError(
          expr,
          `Could not find suffix ${expr.token.lexeme} for type ${type.name}`, []));
    }

    if (suffix.callType !== callType) {
      return this.errors(new KsTypeError(
        expr,
        `Suffix ${expr.token.lexeme} is missing call signiture ${suffix.toTypeString()}`, []));
    }

    return this.result(suffix.returns);
  }

  private visitSuffixTermTrailer(
    type: IArgumentType,
    expr: IExpr,
    callType: SuffixCallType): ITypeResult {
    if (expr instanceof CallExpr) {
      const trailerResult = this.visitSuffixTermTrailer(type, expr.callee, SuffixCallType.call);
      const callResults = this.resolveCall(expr, trailerResult.type, 'suffix');
      return this.result(callResults.type, ...callResults.errors, ...trailerResult.errors);
    }

    if (expr instanceof ArrayIndexExpr) {
      const trailerResult = this.visitSuffixTermTrailer(type, expr.array, callType);
      const indexResult = this.resolveArrayIndex(expr);
      return this.result(indexResult.type, ...indexResult.errors, ...trailerResult.errors);
    }

    if (expr instanceof ArrayBracketExpr) {
      const result = this.visitSuffixTermTrailer(type, expr.array, callType);
      return result;
    }

    if (expr instanceof VariableExpr) {
      return this.visitVariableTrailer(type, expr, callType);
    }

    throw Error(`Invalid suffix term trailer in ${expr.toString()}`);
  }

  public visitCall(expr: CallExpr): ITypeResult {
    if (expr.callee instanceof VariableExpr) {
      const functionType = this.scopeManager.getType(expr.callee.token, expr.callee.token.lexeme);
      return this.resolveCall(expr, functionType, 'function');
    }

    const result = this.checkExpr(expr.callee);
    return this.resolveCall(expr, result.type, 'suffix');
  }

  private resolveCall(
    expr: CallExpr,
    type: Maybe<IType>,
    callType: 'function' | 'suffix'): ITypeResult {
    if (empty(type) || type.tag !== callType) {
      return this.result(
        structureType,
        new KsTypeError(expr.callee, `Unable to determine ${callType} type`, []),
      );
    }

    if (!Array.isArray(type.params)) {
      return this.resolveVaradic(type.params, type.returns, expr);
    }

    return this.resolveParameters(type.params, type.returns, expr);
  }

  private resolveVaradic(
    params: IVariadicType, returns: IBasicType, expr: CallExpr): ITypeResult {
    const errors: ITypeError[] = [];

    for (const arg of expr.args) {
      const result = this.checkExpr(arg);
      if (!coerce(result.type, params.type)) {
        errors.push(new KsTypeError(
          arg, `Function argument could not be coerced into ${params.type.name}`, []));
      }
    }

    return this.result(returns, ...errors);
  }

  private resolveParameters(params: IType[], returns: IBasicType, expr: CallExpr): ITypeResult {
    const errors: ITypeError[] = [];

    for (const [arg, param] of zip(expr.args, params)) {
      const result = this.checkExpr(arg);
      if (!coerce(result.type, param)) {
        errors.push(new KsTypeError(
          arg, `Function argument could not be coerced into ${param.name}`, []));
      }
    }

    // TODO length difference

    return this.result(returns, ...errors);
  }

  public visitArrayIndex(expr: ArrayIndexExpr): ITypeResult {
    return this.resolveArrayIndex(expr);
  }

  private resolveArrayIndex(expr: ArrayIndexExpr): ITypeResult {
    const errors: ITypeError[] = [];

    switch (expr.indexer.type) {
      case TokenType.integer:
        break;
      case TokenType.identifier:
        const type = this.scopeManager.getType(expr.indexer, expr.indexer.lexeme);
        if (empty(type) || !coerce(type, integarType)) {
          errors.push(new KsTypeError(
            expr.indexer,
            `${expr.indexer.lexeme} is not a scalar type. Can only use scalar to index with #`,
            []));
        }

        break;
      default:
        errors.push(new KsTypeError(
          expr.indexer, 'Cannot index array with # other than with scalars or variables', []));
    }

    return this.result(structureType, ...errors);
  }

  public visitArrayBracket(expr: ArrayBracketExpr): ITypeResult {
    const arrayResult = this.checkExpr(expr.array);
    const indexResult = this.checkExpr(expr.index);
    const errors = arrayResult.errors.concat(indexResult.errors);

    if (coerce(arrayResult.type, userListType)) {
      if (!coerce(indexResult.type, scalarType)) {
        errors.push(new KsTypeError(
          expr.index, 'Can only use scalars as list index' +
          'This may not able to be coerced into scalar type',
          []));

        return this.result(structureType, ...errors);
      }
    }

    if (coerce(arrayResult.type, lexiconType)) {
      if (!coerce(indexResult.type, stringType)) {
        errors.push(new KsTypeError(
          expr.index, 'Can only use string as lexicon index' +
          'This may not able to be coerced into string type',
          []));

        return this.result(structureType, ...errors);
      }
    }

    if (!coerce(indexResult.type, stringType) && !coerce(indexResult.type, scalarType)) {
      errors.push(new KsTypeError(
        expr.index, 'Can only use string or scalar as index' +
        'This may not able to be coerced into string or scalar type',
        []));
    }
    return this.result(structureType, ...errors);
  }
  public visitDelegate(expr: DelegateExpr): ITypeResult {
    if (expr) { }
    return this.errors();
  }

  // visit literal expression
  public visitLiteral(expr: LiteralExpr): ITypeResult {
    switch (expr.token.type) {
      case TokenType.true:
      case TokenType.false:
        return this.result(booleanType);
      case TokenType.string:
      case TokenType.fileIdentifier:
        return this.result(stringType);
      case TokenType.integer:
        return this.result(integarType);
      case TokenType.double:
        return this.result(doubleType);
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
    return this.checkExpr(expr.expr);
  }
  public visitAnonymousFunction(expr: AnonymousFunctionExpr): ITypeResult {
    if (expr) { }
    return this.errors();
  }

  private errors(...errors: ITypeError[]): ITypeResult {
    return this.result(structureType, ...errors);
  }
  private result(type: IType, ...errors: ITypeError[]): ITypeResult {
    return { type, errors };
  }
}

const accumulateErrors = <T>(items: T[], checker: (item: T) => TypeErrors): TypeErrors => {
  return items.reduce(
    (accumulator, item) => accumulator.concat(checker(item)),
    [] as TypeErrors);
};
