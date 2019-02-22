import {
  IExprVisitor, IInstVisitor, IInst, IExpr,
  ISuffixTerm, Atom, ISuffixTermParamVisitor,
} from '../parser/types';
import * as SuffixTerm from '../parser/suffixTerm';
import * as Expr from '../parser/expr';
import * as Inst from '../parser/inst';
import * as Decl from '../parser/declare';
import { ITypeError, ITypeResult } from './types';
import { mockLogger, mockTracer } from '../utilities/logger';
import { Script } from '../entities/script';
import { ScopeManager } from '../analysis/scopeManager';
import { empty } from '../utilities/typeGuards';
import {
  IArgumentType, IType,
  IVariadicType, Operator, ISuffixType, IFunctionType,
} from './types/types';
import { structureType } from './types/primitives/structure';
import { coerce } from './coerce';
import { KsTypeError } from './typeError';
import { iterator } from '../utilities/constants';
import { TokenType } from '../entities/tokentypes';
import { nodeType } from './types/node';
import { createFunctionType } from './types/ksType';
import { lexiconType } from './types/collections/lexicon';
import { zip } from '../utilities/arrayUtilities';
import { isSubType, hasOperator, getSuffix, hasSuffix } from './typeUitlities';
import { voidType } from './types/primitives/void';
import { userListType } from './types/collections/userList';
import { booleanType } from './types/primitives/boolean';
import { stringType } from './types/primitives/string';
import { scalarType, integarType, doubleType } from './types/primitives/scalar';
import { suffixError } from './types/typeHelpers';
import { delegateType } from './types/primitives/delegate';

type TypeErrors = ITypeError[];
type SuffixTermType = ISuffixType | IArgumentType;

export class TypeChecker implements
  IExprVisitor<ITypeResult<IArgumentType>>,
  IInstVisitor<TypeErrors>,
  ISuffixTermParamVisitor<IType, ITypeResult<SuffixTermType>> {

  private readonly logger: ILogger;
  private readonly tracer: ITracer;
  private readonly syntaxTree: Script;
  private readonly scopeManager: ScopeManager;

  constructor(
    syntaxTree: Script,
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
  private checkExpr(expr: IExpr): ITypeResult<IArgumentType> {
    return expr.accept(this);
  }

  private checkSuffixTerm(suffixTerm: ISuffixTerm, param: IType): ITypeResult<SuffixTermType> {
    return suffixTerm.acceptParam(this, param);
  }

  // ----------------------------- Declaration -----------------------------------------

  // visit declare variable
  visitDeclVariable(decl: Decl.Var): TypeErrors {
    const result = this.checkExpr(decl.expression);
    this.scopeManager.setType(decl.identifier, decl.identifier.lexeme, result.type);
    return result.errors;
  }

  // visit declare lock
  visitDeclLock(decl: Decl.Lock): TypeErrors {
    const result = this.checkExpr(decl.value);
    this.scopeManager.setType(decl.identifier, decl.identifier.lexeme, result.type);
    return result.errors;
  }

  // visit declare function
  visitDeclFunction(decl: Decl.Func): TypeErrors {
    const funcTracker = this.scopeManager
      .scopedFunctionTracker(decl.start, decl.functionIdentifier.lexeme);

    if (empty(funcTracker)) {
      throw Error('TODO');
    }

    // TODO may need to report if we can't find function tracker
    const { entity } = funcTracker.declared;
    const paramsTypes: IArgumentType[] = [];
    for (let i = 0; i < entity.parameters.length; i += 1) {
      paramsTypes.push(structureType);
    }
    const returnType = entity.returnValue ? structureType : voidType;

    const funcType = createFunctionType(
      funcTracker.declared.entity.name.lexeme, returnType, ...paramsTypes);

    this.scopeManager.setType(entity.name, entity.name.lexeme, funcType);

    const errors = this.checkInst(decl.instructionBlock);
    return errors;
  }

  // visit declare parameter
  visitDeclParameter(decl: Decl.Param): TypeErrors {
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

  // ----------------------------- Instructions -----------------------------------------

  // visit invalid inst
  public visitInstInvalid(_: Inst.Invalid): TypeErrors {
    return [];
  }

  // visit block
  public visitBlock(inst: Inst.Block): TypeErrors {
    return accumulateErrors(inst.insts, this.checkInst.bind(this));
  }

  // visit expression instruction
  public visitExpr(inst: Inst.ExprInst): TypeErrors {
    const result = this.checkExpr(inst.suffix);
    return result.errors;
  }

  // visit on off
  public visitOnOff(inst: Inst.OnOff): TypeErrors {
    const result = this.checkExpr(inst.suffix);
    return result.errors;
  }

  // visit command
  public visitCommand(_: Inst.Command): TypeErrors {
    return [];
  }

  // visit command expression
  public visitCommandExpr(inst: Inst.CommandExpr): TypeErrors {
    const result = this.checkExpr(inst.expr);
    const errors: TypeErrors = result.errors;

    switch (inst.command.type) {
      case TokenType.add:
      case TokenType.remove:
        // expression must be a node type
        if (!coerce(result.type, nodeType)) {
          const command = inst.command.type === TokenType.add
            ? 'add'
            : 'remove';

          errors.push(new KsTypeError(
            inst.expr, `${command} expected a node.` +
            ' Node may not able to be  be coerced into node type',
            []));
        }
        break;
      case TokenType.edit:
        if (!coerce(result.type, nodeType)) {
          errors.push(new KsTypeError(
            inst.expr, 'Path may not be coerced into string type', []));
        }
        break;
      default:
        throw new Error('Unexpected token type found in command expression');
    }

    return result.errors;
  }

  // visit unset
  public visitUnset(_: Inst.Unset): TypeErrors {
    return [];
  }

  // visit unlock
  public visitUnlock(_: Inst.Unlock): TypeErrors {
    return [];
  }

  // visit set
  public visitSet(inst: Inst.Set): TypeErrors {
    const result = this.checkExpr(inst.expr);
    if (inst.suffix instanceof SuffixTerm.Identifier) {
      this.scopeManager.setType(inst.suffix.token, inst.suffix.token.lexeme, result.type);
    } else {
      // TODO suffix case
    }
    return result.errors;
  }

  // visit lazy global directive
  public visitLazyGlobalInst(_: Inst.LazyGlobal): TypeErrors {
    return [];
  }

  // visit if instruction
  public visitIf(inst: Inst.If): TypeErrors {
    const conditionResult = this.checkExpr(inst.condition);
    const errors: TypeErrors = conditionResult.errors;

    if (!coerce(conditionResult.type, booleanType)) {
      errors.push(new KsTypeError(
        inst.condition, 'Condition may not able to be  be coerced into boolean type', []));
    }

    const moreErrors = empty(inst.elseInst)
      ? [this.checkInst(inst.ifInst)]
      : [this.checkInst(inst.ifInst), this.checkInst(inst.elseInst)];
    return errors.concat(...moreErrors);
  }

  // visit else instruction
  public visitElse(inst: Inst.Else): TypeErrors {
    return this.checkInst(inst.inst);
  }

  // visit until instruction
  public visitUntil(inst: Inst.Until): TypeErrors {
    const conditionResult = this.checkExpr(inst.condition);
    const errors = conditionResult.errors;

    if (!coerce(conditionResult.type, booleanType)) {
      errors.push(new KsTypeError(
        inst.condition, 'Condition may not able to be coerced into boolean type', []));
    }

    return errors.concat(this.checkInst(inst.inst));
  }

  // visit from loop
  public visitFrom(inst: Inst.From): TypeErrors {
    let errors: TypeErrors = this.checkInst(inst.initializer);
    const conditionResult = this.checkExpr(inst.condition);
    errors = errors.concat(conditionResult.errors);

    if (!coerce(conditionResult.type, booleanType)) {
      errors.push(new KsTypeError(
        inst.condition, 'Condition may not able to be coerced into boolean type', []));
    }
    return errors.concat(
      this.checkInst(inst.increment),
      this.checkInst(inst.inst));
  }

  // vist when statment
  public visitWhen(inst: Inst.When): TypeErrors {
    const conditionResult = this.checkExpr(inst.condition);
    const errors = conditionResult.errors;

    if (!coerce(conditionResult.type, booleanType)) {
      errors.push(new KsTypeError(
        inst.condition, 'Condition may not able to be coerced into boolean type', []));
    }

    return errors.concat(this.checkInst(inst.inst));
  }

  // visit return
  public visitReturn(inst: Inst.Return): TypeErrors {
    const errors: TypeErrors = [];
    if (!empty(inst.expr)) {
      // TODO maybe update function type?
    }

    return errors;
  }

  // visit break
  public visitBreak(_: Inst.Break): TypeErrors {
    return [];
  }

  // visit switch
  public visitSwitch(inst: Inst.Switch): TypeErrors {
    const result = this.checkExpr(inst.target);
    let errors = result.errors;

    if (coerce(result.type, stringType)) {
      errors = errors.concat(new KsTypeError(
        inst.target, 'May not be a string identifer for volume', []));
    }

    return errors;
  }

  // visit for
  public visitFor(inst: Inst.For): TypeErrors {
    const result = this.checkExpr(inst.suffix);
    let errors: TypeErrors = [];

    const { type } = result;
    if (type.tag !== 'type' || !hasSuffix(type, iterator)) {
      errors = errors.concat(new KsTypeError(
        inst.suffix, 'May not be a valid enumerable type', []));
    }

    // TODO may be able to detect if type is really pure and not mixed
    this.scopeManager.setType(inst.identifier, inst.identifier.lexeme, structureType);
    return errors.concat(this.checkInst(inst.inst));
  }

  // visit on
  public visitOn(inst: Inst.On): TypeErrors {
    const result = this.checkExpr(inst.suffix);
    let errors: TypeErrors = [];

    if (coerce(result.type, booleanType)) {
      errors = errors.concat(new KsTypeError(
        inst.suffix, 'Condition may not able to be coerced into boolean type', []));
    }

    return errors.concat(this.checkInst(inst.inst));
  }

  // visit toggle
  public visitToggle(inst: Inst.Toggle): TypeErrors {
    const result = this.checkExpr(inst.suffix);
    return result.errors;
  }

  // visit wait
  public visitWait(inst: Inst.Wait): TypeErrors {
    const result = this.checkExpr(inst.expr);
    let errors: TypeErrors = result.errors;

    if (empty(inst.until)) {
      if (!coerce(result.type, scalarType)) {
        errors = errors.concat(new KsTypeError(
          inst.expr, 'Wait requires a scalar type. ' +
          'This may not able to be coerced into scalar type',
          []));
      }
    } else {
      if (!coerce(result.type, booleanType)) {
        errors = errors.concat(new KsTypeError(
          inst.expr, 'Wait requires a boolean type. ' +
          'This may not able to be coerced into boolean type',
          []));
      }
    }

    return errors;
  }

  // visit log
  public visitLog(inst: Inst.Log): TypeErrors {
    const exprResult = this.checkExpr(inst.expr);
    const logResult = this.checkExpr(inst.target);
    const errors: TypeErrors = exprResult.errors
      .concat(logResult.errors);

    if (!coerce(exprResult.type, stringType)) {
      errors.push(new KsTypeError(
        inst.expr, 'Can only log a string type. ' +
        'This may not able to be coerced into string type',
        []));
    }

    if (!coerce(exprResult.type, stringType)) {
      errors.push(new KsTypeError(
        inst.expr, 'Can only log to a path. ',
        []));
    }

    return errors;
  }

  // visit copy
  public visitCopy(inst: Inst.Copy): TypeErrors {
    const sourceResult = this.checkExpr(inst.target);
    const targetResult = this.checkExpr(inst.location);
    const errors: TypeErrors = sourceResult.errors
      .concat(targetResult.errors);

    if (!coerce(sourceResult.type, stringType)) {
      errors.push(new KsTypeError(
        inst.target, 'Can only copy from a string or bare path. ' +
        'This may not able to be coerced into string type',
        []));
    }

    if (!coerce(sourceResult.type, stringType)) {
      errors.push(new KsTypeError(
        inst.location, 'Can only copy to a string or bare path. ' +
        'This may not able to be coerced into string type',
        []));
    }

    return errors;
  }

  // visit rename
  public visitRename(inst: Inst.Rename): TypeErrors {
    const sourceResult = this.checkExpr(inst.target);
    const targetResult = this.checkExpr(inst.alternative);
    const errors: TypeErrors = sourceResult.errors
      .concat(targetResult.errors);

    if (!coerce(sourceResult.type, stringType)) {
      errors.push(new KsTypeError(
        inst.target, 'Can only rename from a string or bare path. ' +
        'This may not able to be coerced into string type',
        []));
    }

    if (!coerce(sourceResult.type, stringType)) {
      errors.push(new KsTypeError(
        inst.alternative, 'Can only rename to a string or bare path. ' +
        'This may not able to be coerced into string type',
        []));
    }

    return errors;
  }
  public visitDelete(inst: Inst.Delete): TypeErrors {
    if (inst) { }
    return [];
  }
  public visitRun(inst: Inst.Run): TypeErrors {
    if (inst) { }
    return [];
  }
  public visitRunPath(inst: Inst.RunPath): TypeErrors {
    if (inst) { }
    return [];
  }
  public visitRunPathOnce(inst: Inst.RunPathOnce): TypeErrors {
    if (inst) { }
    return [];
  }
  public visitCompile(inst: Inst.Compile): TypeErrors {
    if (inst) { }
    return [];
  }
  public visitList(inst: Inst.List): TypeErrors {
    if (inst) { }
    return [];
  }

  // visit empty instruction
  public visitEmpty(_: Inst.Empty): TypeErrors {
    return [];
  }

  // vist print instruction
  public visitPrint(inst: Inst.Print): TypeErrors {
    const result = this.checkExpr(inst.expr);
    const errors = result.errors;

    if (!coerce(result.type, structureType)) {
      errors.push(new KsTypeError(
        inst.expr, 'Cannot print a function, can only print structures', []));
    }

    return errors;
  }

  // visit invalid expression
  public visitExprInvalid(_: Expr.Invalid): ITypeResult<IArgumentType> {
    return { type: structureType, errors: [] };
  }

  // ----------------------------- Expressions -----------------------------------------

  public visitBinary(expr: Expr.Binary): ITypeResult<IArgumentType> {
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

  public visitUnary(expr: Expr.Unary): ITypeResult<IArgumentType> {
    const result = this.checkExpr(expr.factor);
    const errors: TypeErrors = result.errors;
    let finalType: Maybe<IArgumentType> = undefined;

    switch (expr.operator.type) {
      case TokenType.plus:
      case TokenType.minus:
        // TODO check if this is true
        if (!coerce(result.type, scalarType)) {
          errors.push(new KsTypeError(
            expr.factor, '+/- only valid for a scalar type. ' +
            'This may not able to be coerced into scalar type',
            []));
        }
        finalType = scalarType;
        break;
      case TokenType.not:
        if (!coerce(result.type, booleanType)) {
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
  public visitFactor(expr: Expr.Factor): ITypeResult<IArgumentType> {
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

  public visitSuffix(expr: Expr.Suffix): ITypeResult<IArgumentType> {
    const { suffixTerm, trailer } = expr;
    const atom = this.resolveAtom(suffixTerm.atom);
    let current: ITypeResult<IType> = atom;

    if (suffixTerm.trailers.length >= 1) {
      const [firstTrailer, ...remainingTrailers] = suffixTerm.trailers;

      // handle case were suffix is actually a function cal
      if (firstTrailer instanceof SuffixTerm.Call) {
        const result = this.resolveFunctionCall(firstTrailer, current.type);
        current = this.resultReduce(result.type, current.errors, result.errors);
      } else {
        const result = this.checkSuffixTerm(firstTrailer, current.type);
        current = this.resultReduce(result.type, current.errors, result.errors);
      }

      for (const trailer of remainingTrailers) {
        const result = this.checkSuffixTerm(trailer, current.type);
        current = this.resultReduce(result.type, current.errors, result.errors);
      }
    }

    const { type, errors } = current;
    if (type.tag === 'suffix' || type.tag === 'function') {
      return this.errorsReduce(
        errors,
        new KsTypeError(suffixTerm.atom, 'TODO', []),
      );
    }

    if (empty(trailer)) {
      return this.resultReduce(type, errors);
    }

    if (trailer.tag === 'expr') {
      const trailerResult = this.resolveSuffix(trailer, type);
      return this.resultReduce(trailerResult.type, errors, trailerResult.errors);
    }

    if (trailer.tag === 'suffixTerm') {
      const trailerResult = this.checkSuffixTerm(trailer, type);
      if (trailerResult.type.tag === 'type') {
        return this.resultReduce(trailerResult.type, errors, trailerResult.errors);
      }

      return this.errorsReduce(
        errors,
        trailerResult.errors,
        new KsTypeError(trailer, 'TODO', []));
    }

    throw new Error('TODO');
  }

  public visitAnonymousFunction(expr: Expr.AnonymousFunction): ITypeResult<IArgumentType> {
    if (expr) { }
    return this.result(delegateType);
  }

  // ----------------------------- Suffix -----------------------------------------

  private resolveSuffix(suffix: Expr.Suffix, temp: IArgumentType): ITypeResult<IArgumentType> {
    const suffixTermResult = this.checkSuffixTerm(suffix.suffixTerm, temp);

    const { type, errors } = suffixTermResult;
    if (type.tag === 'suffix') {
      return this.errorsReduce(
        errors,
        new KsTypeError(suffix.suffixTerm, 'TODO', []),
      );
    }

    if (empty(suffix.trailer)) {
      return this.resultReduce(type, errors);
    }

    let current = suffixTermResult;
    for (const trailer of suffix.suffixTerm.trailers) {
      const trailerResult = this.checkSuffixTerm(trailer, current.type);
      current = this.resultReduce(trailerResult.type, trailerResult.errors, current.errors);
    }

    const finalType = current.type;
    if (finalType.tag === 'type') {
      return this.resultReduce(finalType, current.errors);
    }

    return this.errorsReduce(current.errors, new KsTypeError(suffix, 'TODO', []));
  }

  private resolveAtom(atom: Atom): ITypeResult<IArgumentType | IFunctionType> {
    if (atom instanceof SuffixTerm.Literal) {
      return this.resolveLiteral(atom);
    }

    if (atom instanceof SuffixTerm.Identifier) {
      return this.resolveIdentifier(atom);
    }

    if (atom instanceof SuffixTerm.Grouping) {
      return this.resolveGrouping(atom);
    }

    throw new Error('Unknown atom type');
  }

  private resolveLiteral(literal: SuffixTerm.Literal): ITypeResult<IArgumentType> {
    switch (literal.token.type) {
      case TokenType.true:
      case TokenType.false:
        return this.result(booleanType);
      case TokenType.integer:
        return this.result(integarType);
      case TokenType.double:
        return this.result(doubleType);
      case TokenType.string:
      case TokenType.fileIdentifier:
        return this.result(stringType);
      default:
        throw new Error('Unknown literal type');
    }
  }

  private resolveIdentifier(identifer: SuffixTerm.Identifier)
    : ITypeResult<IArgumentType | IFunctionType> {
    const type = this.scopeManager.getType(identifer, identifer.token.lexeme);
    return empty(type)
      ? this.errors(new KsTypeError(identifer, 'TODO', []))
      : this.result(type);
  }

  private resolveGrouping(grouping: SuffixTerm.Grouping): ITypeResult<IArgumentType> {
    return this.checkExpr(grouping.expr);
  }

  private resolveFunctionCall(call: SuffixTerm.Call, type: IType): ITypeResult<IArgumentType> {
    if (type.tag !== 'function') {
      return this.errors(new KsTypeError(call, 'TODO', []));
    }

    if (!Array.isArray(type.params)) {
      return this.resolveVaradicCall(type.params, type, call);
    }

    // handle normal functions
    return this.resolveNormalCall(type.params, type, call);
  }

  visitSuffixTerm(suffixTerm: SuffixTerm.SuffixTerm, type: IType): ITypeResult<IArgumentType> {
    const atom = this.checkSuffixTerm(suffixTerm.atom, type);
    let result = atom;

    for (const trailer of suffixTerm.trailers) {
      const trailerResult = this.checkSuffixTerm(trailer, result.type);
      result = this.resultReduce(
        trailerResult.type,
        trailerResult.errors,
        result.errors);
    }

    if (result.type.tag === 'suffix') {
      return this.resultReduce(result.type.returns, result.errors);
    }

    return this.resultReduce(result.type, result.errors);
  }
  visitCall(call: SuffixTerm.Call, type: IType): ITypeResult<IArgumentType> {
    if (type.tag !== 'suffix') {
      return this.errors(new KsTypeError(call, 'TODO', []));
    }

    if (!Array.isArray(type.params)) {
      return this.resolveVaradicCall(type.params, type, call);
    }

    // handle normal functions
    return this.resolveNormalCall(type.params, type, call);
  }

  // visit a variadic call trailer
  private resolveVaradicCall(
    params: IVariadicType,
    type: ISuffixType | IFunctionType,
    call: SuffixTerm.Call): ITypeResult<IArgumentType> {
    const errors: ITypeError[] = [];

    for (const arg of call.args) {
      const result = this.checkExpr(arg);
      if (!coerce(result.type, params.type)) {
        errors.push(new KsTypeError(
          arg, `Function argument could not be coerced into ${params.type.name}`, []));
      }
    }

    return this.result(type.returns, ...errors);
  }

  // visit normal call trailer
  private resolveNormalCall(
    params: IType[],
    type: ISuffixType | IFunctionType,
    call: SuffixTerm.Call): ITypeResult<IArgumentType> {
    const errors: ITypeError[] = [];

    for (const [arg, param] of zip(call.args, params)) {
      const result = this.checkExpr(arg);
      if (!coerce(result.type, param)) {
        errors.push(new KsTypeError(
          arg, `Function argument could not be coerced into ${param.name}`, []));
      }
    }

    // TODO length difference
    return this.result(type.returns, ...errors);
  }

  visitArrayIndex(expr: SuffixTerm.ArrayIndex, type: IType): ITypeResult<IArgumentType> {
    if (empty(type)) {
      return this.errors(new KsTypeError(expr, 'Unable to determine type', []));
    }

    // TODO confirm indexable types
    if (!coerce(type, userListType)) {
      return this.errors(new KsTypeError(expr, 'indexing with # requires a list', []));
    }

    switch (expr.indexer.type) {
      case TokenType.integer:
        return this.result(structureType);
      case TokenType.identifier:
        const type = this.scopeManager.getType(expr.indexer, expr.indexer.lexeme);
        if (empty(type) || !coerce(type, integarType)) {
          return this.errors(new KsTypeError(
            expr.indexer,
            `${expr.indexer.lexeme} is not a scalar type. Can only use scalar to index with #`,
            []));
        }

        return this.result(structureType);
      default:
        return this.errors(new KsTypeError(
          expr.indexer, 'Cannot index array with # other than with scalars or variables', []));
    }
  }

  visitArrayBracket(expr: SuffixTerm.ArrayBracket, type: IType): ITypeResult<IArgumentType> {
    const indexResult = this.checkExpr(expr.index);
    const errors = indexResult.errors;

    if (empty(type)) {
      return this.errorsReduce(
        errors,
        new KsTypeError(expr, 'Unable to determine type', []));
    }

    if (coerce(type, userListType) && !coerce(indexResult.type, scalarType)) {
      return this.errorsReduce(
        errors,
        new KsTypeError(
          expr.index, 'Can only use scalars as list index' +
          'This may not able to be coerced into scalar type',
          []));
    }

    if (coerce(type, lexiconType) && !coerce(indexResult.type, stringType)) {
      return this.errorsReduce(
        errors,
        new KsTypeError(
          expr.index, 'Can only use string as lexicon index' +
          'This may not able to be coerced into string type',
          []));
    }

    if (!coerce(type, stringType) && !coerce(indexResult.type, scalarType)) {
      return this.errorsReduce(
        errors,
        new KsTypeError(
          expr.index, 'Can only use string or scalar as index' +
          'This may not able to be coerced into string or scalar type',
          []));
    }

    return this.result(structureType, ...errors);
  }

  visitDelegate(suffixTerm: SuffixTerm.Delegate, type: IType): ITypeResult<IArgumentType> {
    if (empty(type)) {
      return this.errors(new KsTypeError(
        suffixTerm, `Unable to find the type for ${suffixTerm.toString()}`, []));
    }

    if (type.tag !== 'function') {
      return this.errors(new KsTypeError(
        suffixTerm, 'Can only create delegate of functions', []));
    }

    return this.result(delegateType);
  }

  visitLiteral(_: SuffixTerm.Literal, __: IType): ITypeResult<IArgumentType> {
    throw new Error('Literal should not appear outside of suffix atom');
  }

  visitIdentifier(expr: SuffixTerm.Identifier, type: IType): ITypeResult<SuffixTermType> {
    const suffix = getSuffix(type, expr.token.lexeme);

    // may need to pass sommething in about if we're in get set context
    if (empty(suffix))  {
      return this.suffixErrors(
        new KsTypeError(
          expr,
          `Could not find suffix ${expr.token.lexeme} for type ${type.name}`, []));
    }

    return this.result(suffix);
  }

  visitGrouping(_: SuffixTerm.Grouping, __: IType): ITypeResult<IArgumentType> {
    throw new Error('Grouping should not appear outside of suffix atom');
  }

  // ----------------------------- Helpers -----------------------------------------

  // check if the left or right arm have the needed operator
  private checkOperator(
    expr: IExpr,
    leftResult: ITypeResult<IType>,
    rightResult: ITypeResult<IType>,
    operator: Operator): ITypeResult<IArgumentType> {

    const leftType = leftResult.type;
    const rightType = rightResult.type;
    const errors = leftResult.errors.concat(rightResult.errors);
    let calcType: Maybe<IArgumentType> = undefined;

    // TODO could be more efficient
    if (isSubType(leftType, scalarType) && isSubType(rightType, scalarType)) {
      calcType = scalarType;
    } else if (isSubType(leftType, stringType) || isSubType(rightType, stringType)) {
      calcType = stringType;
    } else if (isSubType(leftType, booleanType) || isSubType(rightType, booleanType)) {
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

  private errors(...errors: ITypeError[]): ITypeResult<IArgumentType> {
    return this.result(structureType, ...errors);
  }

  private suffixErrors(...errors: ITypeError[]): ITypeResult<ISuffixType> {
    return this.result(suffixError, ...errors);
  }

  private errorsReduce(
    base: ITypeError[],
    ...errors: (ITypeError | ITypeError[])[]): ITypeResult<IArgumentType> {
    return this.resultReduce(structureType, base, ...errors);
  }

  private result<T extends IType>(type: T, ...errors: ITypeError[]): ITypeResult<T> {
    return { type, errors };
  }

  private resultReduce<T extends IType>(
    type: T,
    base: ITypeError[],
    ...errors: (ITypeError | ITypeError[])[]): ITypeResult<T> {
    return { type, errors: base.concat(...errors) };
  }
}

const accumulateErrors = <T>(items: T[], checker: (item: T) => TypeErrors): TypeErrors => {
  return items.reduce(
    (accumulator, item) => accumulator.concat(checker(item)),
    [] as TypeErrors);
};
