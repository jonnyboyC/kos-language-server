import {
  IExprVisitor, IInstVisitor, IInst, IExpr,
  ISuffixTerm, Atom, ISuffixTermParamVisitor,
} from '../parser/types';
import * as SuffixTerm from '../parser/suffixTerm';
import * as Expr from '../parser/expr';
import * as Inst from '../parser/inst';
import * as Decl from '../parser/declare';
import {
  ITypeError, ITypeResult, ITypeResolved,
  ITypeResultSuffix, ITypeResolvedSuffix, ITypeNode,
} from './types';
import { mockLogger, mockTracer } from '../utilities/logger';
import { Script } from '../entities/script';
import { ScopeManager } from '../analysis/scopeManager';
import { empty } from '../utilities/typeGuards';
import {
  IArgumentType, IType,
  IVariadicType, Operator, ISuffixType, IFunctionType, CallType,
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
import {
  suffixError, delegateCreation,
  arrayBracketIndexer, arrayIndexer,
} from './types/typeHelpers';
import { delegateType } from './types/primitives/delegate';
import { TypeNode } from './typeNode';
import { EntityType } from '../analysis/types';
import { rangeEqual } from '../utilities/positionHelpers';

type TypeErrors = ITypeError[];
type SuffixTermType = ISuffixType | IArgumentType;

export class TypeChecker implements
  IInstVisitor<TypeErrors>,
  IExprVisitor<ITypeResult<IArgumentType>>,
  ISuffixTermParamVisitor<ITypeResultSuffix<IType>, ITypeResultSuffix<SuffixTermType>> {

  private readonly logger: ILogger;
  private readonly tracer: ITracer;
  private readonly script: Script;
  private readonly scopeManager: ScopeManager;

  constructor(
    script: Script,
    scopeManager: ScopeManager,
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer) {
    this.script = script;
    this.scopeManager = scopeManager;
    this.logger = logger;
    this.tracer = tracer;
  }

  public check(): ITypeError[] {
    // resolve the sequence of instructions
    try {
      return this.checkInsts(this.script.insts);
    } catch (err) {
      this.logger.error(`Error occured in type checker ${err}`);
      this.tracer.log(err);
      return [];
    }
  }

  public checkSuffix(suffix: Expr.Suffix): ITypeResultSuffix<IType, ITypeResolved> {
    try {
      const { suffixTerm, trailer } = suffix;
      const [firstTrailer, ...remainingTrailers] = suffixTerm.trailers;

      const atom = firstTrailer instanceof SuffixTerm.Call
        ? this.resolveAtom(suffixTerm.atom, EntityType.function)
        : this.resolveAtom(
          suffixTerm.atom, EntityType.lock,
          EntityType.parameter, EntityType.variable);
      let current: ITypeResultSuffix<IType> = atom;

      if (!empty(firstTrailer)) {

        // handle case were suffix is actually a function call
        if (firstTrailer instanceof SuffixTerm.Call) {
          current = this.resolveFunctionCall(firstTrailer, atom);
        } else {
          current = this.checkSuffixTerm(firstTrailer, atom);
        }

        for (const trailer of remainingTrailers) {
          current = this.checkSuffixTerm(trailer, current);
        }
      }

      const { type, resolved, errors } = current;
      if (type.tag === 'suffix' || type.tag === 'function') {
        // const node = this.lastSuffixTermNode(suffixTerm);
        return this.errorsSuffixTerm(
          resolved,
          errors,
          new KsTypeError(suffixTerm.atom, 'TODO', []),
        ) as ITypeResultSuffix<IType, ITypeResolved>;
      }

      if (empty(trailer)) {
        return current as ITypeResultSuffix<IType, ITypeResolved>;
      }

      const suffixTrailer = this.checkSuffixTerm(
        trailer,
        this.dummyResult(type, suffixTerm));
      // const node = this.lastSuffixNode(suffix);

      return this.resultSuffixTerm(
        suffixTrailer.type,
        { ...current.resolved, suffixTrailer: suffixTrailer.resolved },
        current.errors,
        suffixTrailer.errors) as ITypeResultSuffix<IType, ITypeResolved>;
    } catch (err) {
      this.logger.error(`Error occured in resolver ${err}`);
      this.tracer.log(err);
      return {
        type: structureType,
        resolved: {
          atomType: EntityType.variable,
          node: new TypeNode(structureType, suffix.suffixTerm),
          termTrailers: [],
        },
        errors: ([] as ITypeError[]),
      };
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

  // check suffix terms
  private checkSuffixTerm(
    suffixTerm: ISuffixTerm,
    current: ITypeResultSuffix<IType>): ITypeResultSuffix<SuffixTermType> {
    return suffixTerm.acceptParam(this, current);
  }

  // ----------------------------- Declaration -----------------------------------------

  // visit declare variable
  visitDeclVariable(decl: Decl.Var): TypeErrors {
    const result = this.checkExpr(decl.expression);
    this.scopeManager.declareType(
      decl.identifier, decl.identifier.lexeme,
      result.type, EntityType.variable);
    return result.errors;
  }

  // visit declare lock
  visitDeclLock(decl: Decl.Lock): TypeErrors {
    const result = this.checkExpr(decl.value);
    this.scopeManager.declareType(
      decl.identifier, decl.identifier.lexeme,
      result.type, EntityType.lock);
    return result.errors;
  }

  // visit declare function
  visitDeclFunction(decl: Decl.Func): TypeErrors {
    const funcTracker = this.scopeManager
      .scopedFunctionTracker(decl.start, decl.functionIdentifier.lexeme);

    if (empty(funcTracker)) {
      throw Error('TODO');
    }

    const { entity } = funcTracker.declared;
    const paramsTypes: IArgumentType[] = [];
    for (let i = 0; i < entity.parameters.length; i += 1) {
      paramsTypes.push(structureType);
    }
    const returnType = entity.returnValue ? structureType : voidType;

    const funcType = createFunctionType(
      funcTracker.declared.entity.name.lexeme, returnType, ...paramsTypes);

    this.scopeManager.declareType(
      entity.name, entity.name.lexeme,
      funcType, EntityType.function);

    const errors = this.checkInst(decl.instructionBlock);
    return errors;
  }

  // visit declare parameter
  visitDeclParameter(decl: Decl.Param): TypeErrors {
    let errors: TypeErrors = [];

    // loop over defaulted parameters
    for (const defaulted of decl.defaultParameters) {
      const valueResult = this.checkExpr(defaulted.value);
      this.scopeManager.declareType(
        defaulted.identifier,
        defaulted.identifier.lexeme,
        valueResult.type,
        EntityType.parameter,
      );

      errors = errors.concat(valueResult.errors);
    }

    // loop over normal parameters
    for (const parameter of decl.parameters) {
      this.scopeManager.declareType(
        parameter.identifier,
        parameter.identifier.lexeme,
        structureType,
        EntityType.parameter,
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
    const exprResult = this.checkExpr(inst.expr);
    const errors = exprResult.errors;

    // check if set ends in call
    if (inst.suffix.endsInCall()) {
      return errors.concat(
        new KsTypeError(
          inst.suffix,
          `Cannot set ${inst.suffix.toString()} as it is a call`,
          []));
    }

    const { atom, trailers } = inst.suffix.suffixTerm;

    // if a suffix trailer exists we are a full suffix
    if (!empty(inst.suffix.trailer) || trailers.length > 0) {
      const suffixResult = this.checkExpr(inst.suffix);
      const setErrors: TypeErrors = [];

      if (!coerce(exprResult.type, suffixResult.type)) {
        setErrors.push(new KsTypeError(
          inst.suffix,
          `Cannot set suffix ${inst.suffix.toString()} ` +
          `of type ${suffixResult.type.name} to ${exprResult.type.name}`,
          []));
      }

      return errors.concat(
        suffixResult.errors,
        setErrors);
    }

    if (atom instanceof SuffixTerm.Identifier) {
      const tracker = this.scopeManager.scopedVariableTracker(
        atom.start,
        atom.token.lexeme);

      if (this.script.lazyGlobal
        && !empty(tracker)
        && rangeEqual(tracker.declared.range, atom)) {
        this.scopeManager.declareType(atom.token, atom.token.lexeme, exprResult.type);
      } else {
        this.scopeManager.setType(atom.token, atom.token.lexeme, exprResult.type);
      }
    } else {
      errors.push(new KsTypeError(
        inst.suffix,
        `Cannot set ${inst.suffix.toString()}, must be identifier, or suffix`,
        []));
    }

    return errors;
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

    const { type: type } = result;

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
    const targetResult = this.checkExpr(inst.destination);
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
        inst.destination, 'Can only copy to a string or bare path. ' +
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
        if (!isSubType(leftResult.type, booleanType)
        || !isSubType(leftResult.type, booleanType)) {
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

    if (!coerce(suffixResult.type, scalarType)) {
      errors.push(new KsTypeError(
        expr.suffix, 'Can only use scalars as base of power' +
        'This may not able to be coerced into scalar type',
        []));
    }

    if (!coerce(exponentResult.type, scalarType)) {
      errors.push(new KsTypeError(
        expr.exponent, 'Can only use scalars as exponent of power' +
        'This may not able to be coerced into scalar type',
        []));
    }

    return {  errors, type: scalarType };
  }

  public visitSuffix(expr: Expr.Suffix): ITypeResult<IArgumentType> {
    const { suffixTerm, trailer } = expr;
    const [firstTrailer, ...remainingTrailers] = suffixTerm.trailers;

    const atom = firstTrailer instanceof SuffixTerm.Call
      ? this.resolveAtom(suffixTerm.atom, EntityType.function)
      : this.resolveAtom(
        suffixTerm.atom, EntityType.variable,
        EntityType.lock, EntityType.parameter);
    let current: ITypeResultSuffix<IType> = atom;

    if (!empty(firstTrailer)) {

      // handle case were suffix is actually a function call
      if (firstTrailer instanceof SuffixTerm.Call) {
        current = this.resolveFunctionCall(firstTrailer, atom);
      } else {
        current = this.checkSuffixTerm(firstTrailer, atom);
      }

      for (const trailer of remainingTrailers) {
        current = this.checkSuffixTerm(trailer, current);
      }
    }

    const { type, errors } = current;
    if (type.tag === 'suffix' || type.tag === 'function') {
      throw new Error('Type shouldn');
    }

    if (empty(trailer)) {
      return this.resultExpr(type, errors);
    }

    current = this.checkSuffixTerm(trailer, current);

    if (current.type.tag === 'type') {
      return this.resultExpr(current.type, current.errors);
    }

    return this.errorsExpr(
      errors,
      current.errors,
      new KsTypeError(trailer, 'TODO', []));
  }

  public visitAnonymousFunction(_: Expr.AnonymousFunction): ITypeResult<IArgumentType> {
    return this.resultExpr(delegateType);
  }

  // ----------------------------- Suffix -----------------------------------------

  private resolveAtom(
    atom: Atom,
    ...entityType: EntityType[])
    : ITypeResultSuffix<IArgumentType | IFunctionType, ITypeResolved> {
    if (atom instanceof SuffixTerm.Literal) {
      return this.resolveLiteral(atom);
    }

    if (atom instanceof SuffixTerm.Identifier) {
      return this.resolveIdentifier(atom, entityType);
    }

    if (atom instanceof SuffixTerm.Grouping) {
      return this.resolveGrouping(atom);
    }

    throw new Error('Unknown atom type');
  }

  private resolveLiteral(literal: SuffixTerm.Literal)
    : ITypeResultSuffix<IArgumentType, ITypeResolved> {
    switch (literal.token.type) {
      case TokenType.true:
      case TokenType.false:
        return this.resultAtom(booleanType, literal, EntityType.variable);
      case TokenType.integer:
        return this.resultAtom(integarType, literal, EntityType.variable);
      case TokenType.double:
        return this.resultAtom(doubleType, literal, EntityType.variable);
      case TokenType.string:
      case TokenType.fileIdentifier:
        return this.resultAtom(stringType, literal, EntityType.variable);
      default:
        throw new Error('Unknown literal type');
    }
  }

  private resolveIdentifier(
    identifer: SuffixTerm.Identifier,
    entityTypes: EntityType[])
    : ITypeResultSuffix<IArgumentType | IFunctionType, ITypeResolved> {
    const type = this.scopeManager.getType(identifer, identifer.token.lexeme, ...entityTypes);
    const entity = this.scopeManager.scopedEntity(identifer.start, identifer.token.lexeme);
    return (empty(type) || empty(entity))
      ? this.errorsAtom(
        identifer,
        new KsTypeError(identifer, 'Unable to lookup identifier type', []))
      : this.resultAtom(type, identifer, entity.tag);
  }

  private resolveGrouping(grouping: SuffixTerm.Grouping)
    : ITypeResultSuffix<IArgumentType, ITypeResolved> {
    const result = this.checkExpr(grouping.expr);
    return this.resultAtom(result.type, grouping, EntityType.variable, result.errors);
  }

  private resolveFunctionCall(
    call: SuffixTerm.Call,
    current: ITypeResultSuffix<IType, ITypeResolved>)
    : ITypeResultSuffix<IArgumentType, ITypeResolved> {
    const { type, resolved, errors } = current;
    if (type.tag !== 'function') {
      return this.errorsAtom(
        call,
        new KsTypeError(call, `Type ${type.name} does not have a call signiture`, []));
    }

    if (!Array.isArray(type.params)) {
      const callResult = this.resolveVaradicCall(type.params, { type, resolved, errors }, call);
      return { ...callResult, resolved: { ...callResult.resolved, atomType: EntityType.function } };
    }

    // handle normal functions
    const callResult = this.resolveNormalCall(type.params, { type, resolved, errors }, call);
    return { ...callResult, resolved: { ...callResult.resolved, atomType: EntityType.function } };
  }

  public visitSuffixTrailer(
    suffixTerm: SuffixTerm.SuffixTrailer,
    current: ITypeResultSuffix<IType>): ITypeResultSuffix<SuffixTermType> {

    // check suffix term and trailers
    const result = this.checkSuffixTerm(suffixTerm.suffixTerm, current);
    const { type, resolved, errors } = result;

    // if no trailer exist attempt to return
    if (empty(suffixTerm.trailer)) {
      if (type.tag === 'type') {
        return { type, resolved, errors };
      }

      return this.errorsSuffixTermTrailer(
        suffixTerm,
        resolved,
        errors,
        new KsTypeError(
          suffixTerm.suffixTerm,
          `suffix ${result.type.name} ` +
          `of type ${result.type.toTypeString()} ` +
          'does not have a call signiture',
          []));
    }

    const trailer = this.checkSuffixTerm(
      suffixTerm.trailer,
      this.dummyResult(type, suffixTerm));
    // const node = this.lastSuffixNode(suffixTerm);

    return this.resultSuffixTerm(
      trailer.type,
      { ...result.resolved, suffixTrailer: trailer.resolved },
      result.errors,
      trailer.errors);
  }

  public visitSuffixTermInvalid(
    suffixTerm: SuffixTerm.Invalid,
    param: ITypeResultSuffix<IType>): ITypeResultSuffix<IArgumentType> {
    if (suffixTerm && param) {
      console.log('TODO');
    }

    throw new Error('Method not implemented.');
  }

  public visitSuffixTerm(
    suffixTerm: SuffixTerm.SuffixTerm,
    current: ITypeResultSuffix<IType>): ITypeResultSuffix<IArgumentType> {
    const atom = this.checkSuffixTerm(suffixTerm.atom, current);
    let result = atom;

    for (const trailer of suffixTerm.trailers) {
      result = this.checkSuffixTerm(trailer, result);
    }

    const { type, resolved, errors } = result;

    // if we only have some basic type return it
    if (type.tag === 'type') {
      return { type, resolved, errors };
    }

    // if we end with a suffix type that doesn't require a call return it.
    if (type.callType !== CallType.call) {
      return { resolved, errors, type: type.returns };
    }

    // if we end with a suffix type which requires a call that's an error.
    return this.errorsSuffixTermTrailer(
      this.lastSuffixTermNode(suffixTerm),
      resolved,
      errors);
  }
  public visitCall(
    call: SuffixTerm.Call,
    current: ITypeResultSuffix<IType>): ITypeResultSuffix<IArgumentType> {
    const { type, resolved, errors } = current;

    if (type.tag !== 'suffix') {
      // TEST we can apparently call a suffix with no argument fine.
      if (type.tag === 'type' && call.args.length === 0) {
        return this.resultSuffixTermTrailer(type, call, resolved);
      }

      return this.errorsSuffixTermTrailer(
        call,
        resolved,
        new KsTypeError(
          call,
          `type ${type.name} does not have call signiture`, []));
    }

    if (!Array.isArray(type.params)) {
      return this.resolveVaradicCall(type.params, { type, resolved, errors }, call);
    }

    // handle normal functions
    return this.resolveNormalCall(type.params, { type, resolved, errors }, call);
  }

  // visit a variadic call trailer
  private resolveVaradicCall(
    params: IVariadicType,
    current: ITypeResultSuffix<ISuffixType | IFunctionType>,
    call: SuffixTerm.Call): ITypeResultSuffix<IArgumentType> {
    const { type, resolved, errors } = current;

    for (const arg of call.args) {
      const result = this.checkExpr(arg);
      if (!coerce(result.type, params.type)) {
        errors.push(new KsTypeError(
          arg, `Function argument could not be coerced into ${params.type.name}`, []));
      }
    }

    return this.resultSuffixTermTrailer(type, call, resolved, errors);
  }

  // visit normal call trailer
  private resolveNormalCall(
    params: IType[],
    current: ITypeResultSuffix<ISuffixType | IFunctionType>,
    call: SuffixTerm.Call): ITypeResultSuffix<IArgumentType> {
    const { type, resolved, errors } = current;

    for (const [arg, param] of zip(call.args, params)) {
      const result = this.checkExpr(arg);
      if (!coerce(result.type, param)) {
        errors.push(new KsTypeError(
          arg, `Function argument could not be coerced into ${param.name}`, []));
      }
    }

    // TODO length difference
    return this.resultSuffixTermTrailer(type, call, resolved, errors);
  }

  public visitArrayIndex(
    suffixTerm: SuffixTerm.ArrayIndex,
    current: ITypeResultSuffix<IType>): ITypeResultSuffix<IArgumentType> {
    const { type, errors, resolved } = current;

    // TODO confirm indexable types
    if (!coerce(type, userListType)) {
      return this.errorsSuffixTermTrailer(
        suffixTerm,
        resolved,
        errors,
        new KsTypeError(suffixTerm, 'indexing with # requires a list', []));
    }

    switch (suffixTerm.indexer.type) {
      case TokenType.integer:
        return this.resultSuffixTermTrailer(arrayIndexer, suffixTerm, resolved, errors);
      case TokenType.identifier:
        const type = this.scopeManager.getType(suffixTerm.indexer, suffixTerm.indexer.lexeme);
        if (empty(type) || !coerce(type, integarType)) {
          return this.errorsSuffixTermTrailer(
            suffixTerm,
            resolved,
            errors,
            new KsTypeError(
              suffixTerm.indexer,
              `${suffixTerm.indexer.lexeme} is not a scalar type. ` +
              'Can only use scalar to index with #',
              []));
        }

        return this.resultSuffixTermTrailer(arrayIndexer, suffixTerm, resolved, errors);
      default:
        return this.errorsSuffixTermTrailer(
          suffixTerm,
          resolved,
          errors,
          new KsTypeError(
            suffixTerm.indexer,
            'Cannot index array with # other than with scalars or variables', []));
    }
  }

  public visitArrayBracket(
    suffixTerm: SuffixTerm.ArrayBracket,
    current: ITypeResultSuffix<IType>): ITypeResultSuffix<IArgumentType> {
    const { type, resolved, errors } = current;
    const indexResult = this.checkExpr(suffixTerm.index);

    if (coerce(type, userListType) && !coerce(indexResult.type, scalarType)) {
      return this.errorsSuffixTermTrailer(
        suffixTerm,
        resolved,
        errors,
        indexResult.errors,
        new KsTypeError(
          suffixTerm.index, 'Can only use scalars as list index' +
          'This may not able to be coerced into scalar type',
          []));
    }

    if (coerce(type, lexiconType) && !coerce(indexResult.type, stringType)) {
      return this.errorsSuffixTermTrailer(
        suffixTerm,
        resolved,
        errors,
        indexResult.errors,
        new KsTypeError(
          suffixTerm.index, 'Can only use string as lexicon index' +
          'This may not able to be coerced into string type',
          []));
    }

    if (!coerce(type, stringType) && !coerce(indexResult.type, scalarType)) {
      return this.errorsSuffixTermTrailer(
        suffixTerm,
        resolved,
        errors,
        indexResult.errors,
        new KsTypeError(
          suffixTerm.index, 'Can only use string or scalar as index' +
          'This may not able to be coerced into string or scalar type',
          []));
    }

    return this.resultSuffixTermTrailer(arrayBracketIndexer, suffixTerm, resolved, errors);
  }

  public visitDelegate(
    suffixTerm: SuffixTerm.Delegate,
    current: ITypeResultSuffix<IType>): ITypeResultSuffix<IArgumentType> {
    const { type, resolved, errors } = current;
    if (type.tag !== 'function') {
      return this.errorsSuffixTermTrailer(
        suffixTerm,
        resolved,
        errors,
        new KsTypeError(suffixTerm, 'Can only create delegate of functions', []));
    }

    return this.resultSuffixTermTrailer(delegateCreation, suffixTerm, resolved, errors);
  }

  public visitLiteral(
    _: SuffixTerm.Literal,
    __: ITypeResultSuffix<IType>): ITypeResultSuffix<IArgumentType> {
    throw new Error('Literal should not appear outside of suffix atom');
  }

  /**
   * visit the suffix term for identifier.
   * @param suffixTerm identifier syntax node
   * @param current current type
   */
  public visitIdentifier(
    suffixTerm: SuffixTerm.Identifier,
    current: ITypeResultSuffix<IType>): ITypeResultSuffix<SuffixTermType> {
    const { type, resolved, errors } = current;
    const suffix = getSuffix(type, suffixTerm.token.lexeme);

    // may need to pass sommething in about if we're in get set context
    if (empty(suffix))  {
      return this.errorsSuffixTerm(
        { ...resolved, node: new TypeNode(suffixError, suffixTerm) },
        errors,
        new KsTypeError(
          suffixTerm,
          `Could not find suffix ${suffixTerm.token.lexeme} for type ${type.name}`, []));
    }

    return this.resultSuffixTerm(
      suffix,
      { ...resolved, node: new TypeNode(suffix, suffixTerm) },
      errors);
  }

  /**
   * visit the suffix term for grouping. grouping is invalid in this context
   * @param _ grouping syntax node
   * @param __ current type
   */
  public visitGrouping(
    _: SuffixTerm.Grouping,
    __: ITypeResultSuffix<IType>): ITypeResultSuffix<IArgumentType> {
    throw new Error('Grouping should not appear outside of suffix atom');
  }

  // ----------------------------- Helpers -----------------------------------------

  /**
   * Check if the current operator is valid and it's resulting type
   * @param expr the operator expresion
   * @param leftResult the left type
   * @param rightResult the right type
   * @param operator the operator to consider
   */
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

  /**
   * Accumulate all type errors defaults to structure type
   * @param errors type errors
   */
  private errorsExpr(
    ...errors: (ITypeError | ITypeError[])[]): ITypeResult<IArgumentType> {
    return this.resultExpr(structureType, ...errors);
  }

  /**
   * Return the resultant type with any errors
   * @param type current type
   * @param errors accumulated errors
   */
  private resultExpr<T extends IType>(
    type: T,
    ...errors: (ITypeError | ITypeError[])[]): ITypeResult<T> {
    return {
      type,
      errors: ([] as ITypeError[]).concat(...errors),
    };
  }

  /**
   * an error for a suffixterm trailer
   * @param resolved the current resolved type
   * @param errors the accumulated errors
   */
  private errorsSuffixTermTrailer(
    node: SuffixTerm.SuffixTermBase,
    resolved: ITypeResolvedSuffix,
    ...errors: (ITypeError | ITypeError[])[])
    : ITypeResultSuffix<IArgumentType, ITypeResolvedSuffix> {
    return this.resultSuffixTermTrailer(suffixError, node, resolved, ...errors);
  }

  /**
   * result of a suffix term trailer
   * @param type the current type
   * @param resolved the type resolve so far
   * @param errors the accumlated type errors
   */
  private resultSuffixTermTrailer(
    type: IType,
    node: SuffixTerm.SuffixTermBase,
    resolved: ITypeResolvedSuffix,
    ...errors: (ITypeError | ITypeError[])[])
    : ITypeResultSuffix<IArgumentType, ITypeResolvedSuffix> {
    const { node: current, termTrailers, suffixTrailer } = resolved;
    let returns = structureType;
    if (type.tag === 'function' || type.tag === 'suffix') {
      returns = type.returns;
    } else {
      returns = type;
    }

    return this.resultSuffixTerm(
      returns,
      { suffixTrailer, node: current, termTrailers: [...termTrailers, new TypeNode(type, node)] },
      ...errors);
  }

  /**
   * Return the suffix error type
   * @param resolved the currently resolved type
   * @param errors all accumulated errors
   */
  private errorsSuffixTerm<R extends ITypeResolvedSuffix>(
    resolved: R,
    ...errors: (ITypeError | ITypeError[])[])
    : ITypeResultSuffix<ISuffixType, R> {
    return this.resultSuffixTerm(
      suffixError,
      resolved,
      ...errors);
  }

  /**
   * Return the suffix error type
   * @param resolved the currently resolved type
   * @param errors all accumulated errors
   */
  private resultSuffixTerm<T extends IType, R extends ITypeResolvedSuffix>(
    type: T,
    resolved: R,
    ...errors: (ITypeError | ITypeError[])[])
    : ITypeResultSuffix<T, R> {
    return {
      type,
      resolved,
      errors: ([] as ITypeError[]).concat(...errors),
    };
  }

  private errorsAtom(
    node: SuffixTerm.SuffixTermBase,
    ...errors: (ITypeError | ITypeError[])[])
    : ITypeResultSuffix<IArgumentType, ITypeResolved> {
    return this.resultAtom(structureType, node, EntityType.variable, ...errors);
  }

  private resultAtom<T extends IType>(
    type: T,
    node: SuffixTerm.SuffixTermBase,
    atomType: EntityType,
    ...errors: (ITypeError | ITypeError[])[])
    : ITypeResultSuffix<T, ITypeResolved> {
    return {
      type,
      errors: ([] as ITypeError[]).concat(...errors),
      resolved: {
        atomType,
        node: new TypeNode(type, node),
        termTrailers: [],
      },
    };
  }

  private dummyResult<T extends IType>(
    type: T,
    node: SuffixTerm.SuffixTermBase): ITypeResultSuffix<T, ITypeResolvedSuffix> {
    return {
      type,
      resolved: {
        node: new TypeNode(type, node),
        termTrailers: ([] as ITypeNode<IType>[]),
      },
      errors: [],
    };
  }

  // private lastSuffixNode(
  //   suffix: SuffixTerm.SuffixTrailer | Expr.Suffix)
  //   : SuffixTerm.SuffixTermBase {
  //   const { suffixTerm, trailer } = suffix;
  //   if (!empty(trailer)) {
  //     return this.lastSuffixNode(trailer);
  //   }

  //   return this.lastSuffixTermNode(suffixTerm);
  // }

  private lastSuffixTermNode(
    suffixTerm: SuffixTerm.SuffixTerm)
    : SuffixTerm.SuffixTermBase {

    return suffixTerm.trailers.length > 0
      ? suffixTerm.trailers[suffixTerm.trailers.length - 1]
      : suffixTerm.atom;
  }
}

const accumulateErrors = <T>(items: T[], checker: (item: T) => TypeErrors): TypeErrors => {
  return items.reduce(
    (accumulator, item) => accumulator.concat(checker(item)),
    [] as TypeErrors);
};
