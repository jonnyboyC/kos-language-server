import {
  IExprVisitor, IInstVisitor, IInst, IExpr,
  ISuffixTerm, Atom, ISuffixTermParamVisitor,
} from '../parser/types';
import * as SuffixTerm from '../parser/suffixTerm';
import * as Expr from '../parser/expr';
import * as Inst from '../parser/inst';
import * as Decl from '../parser/declare';
import {
  ITypeError, ITypeResultExpr, ITypeResolved,
  ITypeResultSuffix, ITypeResolvedSuffix, ITypeNode,
} from './types';
import { mockLogger, mockTracer } from '../utilities/logger';
import { Script } from '../entities/script';
import { SymbolTable } from '../analysis/symbolTable';
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
import { KsSymbolKind } from '../analysis/types';
import { rangeEqual } from '../utilities/positionHelpers';
import { listType } from './types/collections/list';
import { bodyTargetType } from './types/orbital/bodyTarget';
import { vesselTargetType } from './types/orbital/vesselTarget';
import { volumeType } from './types/io/volume';
import { volumeItemType } from './types/io/volumeItem';
import { partModuleFieldsType } from './types/parts/partModuleFields';
import { partType } from './types/parts/part';
import { pathType } from './types/io/path';

type TypeErrors = ITypeError[];
type SuffixTermType = ISuffixType | IArgumentType;

export class TypeChecker implements
  IInstVisitor<TypeErrors>,
  IExprVisitor<ITypeResultExpr<IArgumentType>>,
  ISuffixTermParamVisitor<ITypeResultSuffix<IType>, ITypeResultSuffix<SuffixTermType>> {

  private readonly logger: ILogger;
  private readonly tracer: ITracer;
  private readonly script: Script;
  private readonly symbolTable: SymbolTable;

  constructor(
    script: Script,
    symbolTable: SymbolTable,
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer) {
    this.script = script;
    this.symbolTable = symbolTable;
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
        ? this.resolveAtom(suffixTerm.atom, KsSymbolKind.function)
        : this.resolveAtom(
          suffixTerm.atom, KsSymbolKind.lock,
          KsSymbolKind.parameter, KsSymbolKind.variable);
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
        this.suffixTrailerResult(type, suffixTerm));

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
          atomType: KsSymbolKind.variable,
          atom: new TypeNode(structureType, suffix.suffixTerm),
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
  private checkExpr(expr: IExpr): ITypeResultExpr<IArgumentType> {
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
    const result = this.checkExpr(decl.value);
    this.symbolTable.declareType(
      decl.identifier,
      result.type, KsSymbolKind.variable);
    return result.errors;
  }

  // visit declare lock
  visitDeclLock(decl: Decl.Lock): TypeErrors {
    const result = this.checkExpr(decl.value);
    this.symbolTable.declareType(
      decl.identifier,
      result.type, KsSymbolKind.lock);
    return result.errors;
  }

  // visit declare function
  visitDeclFunction(decl: Decl.Func): TypeErrors {
    const funcTracker = this.symbolTable
      .scopedFunctionTracker(decl.start, decl.identifier.lexeme);

    if (empty(funcTracker)) {
      throw Error('TODO');
    }

    const { symbol } = funcTracker.declared;
    const paramsTypes: IArgumentType[] = [];
    for (let i = 0; i < symbol.parameters.length; i += 1) {
      paramsTypes.push(structureType);
    }
    const returnType = symbol.returnValue ? structureType : voidType;

    const funcType = createFunctionType(
      funcTracker.declared.symbol.name.lexeme, returnType, ...paramsTypes);

    this.symbolTable.declareType(symbol.name, funcType, KsSymbolKind.function);

    const errors = this.checkInst(decl.block);
    return errors;
  }

  // visit declare parameter
  visitDeclParameter(decl: Decl.Param): TypeErrors {
    let errors: TypeErrors = [];

    // loop over defaulted parameters
    for (const defaulted of decl.defaultParameters) {
      const valueResult = this.checkExpr(defaulted.value);
      this.symbolTable.declareType(
        defaulted.identifier,
        valueResult.type,
        KsSymbolKind.parameter,
      );

      errors = errors.concat(valueResult.errors);
    }

    // loop over normal parameters
    for (const parameter of decl.parameters) {
      this.symbolTable.declareType(
        parameter.identifier,
        structureType,
        KsSymbolKind.parameter,
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
    const exprResult = this.checkExpr(inst.value);
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
      const tracker = this.symbolTable.scopedVariableTracker(
        atom.start,
        atom.token.lexeme);

      if (this.script.lazyGlobal
        && !empty(tracker)
        && rangeEqual(tracker.declared.range, atom)) {
        this.symbolTable.declareType(
          atom.token, exprResult.type,
          KsSymbolKind.variable, KsSymbolKind.parameter, KsSymbolKind.lock);
      } else {
        this.symbolTable.setType(
          atom.token, exprResult.type,
        );
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
  public visitLazyGlobal(_: Inst.LazyGlobal): TypeErrors {
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
    this.symbolTable.setType(inst.identifier, structureType);
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
    const targetResult = this.checkExpr(inst.target);
    const alternativeResult = this.checkExpr(inst.alternative);
    const errors: TypeErrors = targetResult.errors
      .concat(alternativeResult.errors);

    if (!coerce(targetResult.type, stringType)) {
      errors.push(new KsTypeError(
        inst.target, 'Can only rename from a string or bare path. ' +
        'This may not able to be coerced into string type',
        []));
    }

    if (!coerce(targetResult.type, stringType)) {
      errors.push(new KsTypeError(
        inst.alternative, 'Can only rename to a string or bare path. ' +
        'This may not able to be coerced into string type',
        []));
    }

    return errors;
  }
  public visitDelete(inst: Inst.Delete): TypeErrors {
    const targetResult = this.checkExpr(inst.target);
    const errors: TypeErrors = targetResult.errors;

    if (!coerce(targetResult.type, stringType)) {
      errors.push(new KsTypeError(
        inst.target, 'Can only delete from a string or bare path. ' +
        'This may not able to be coerced into string type',
        []));
    }

    if (empty(inst.volume)) {
      return errors;
    }

    const volumeResult = this.checkExpr(inst.volume);
    if (!coerce(targetResult.type, stringType) && !coerce(targetResult.type, pathType)) {
      errors.push(new KsTypeError(
        inst.volume, 'Can only rename to a string or bare path. ' +
        'This may not able to be coerced into string type',
        []));
    }

    return errors.concat(volumeResult.errors);
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
    const targetResult = this.checkExpr(inst.target);
    const errors: TypeErrors = targetResult.errors;

    if (!coerce(targetResult.type, stringType)) {
      errors.push(new KsTypeError(
        inst.target, 'Can only compile from a string or bare path. ' +
        'This may not able to be coerced into string type',
        []));
    }

    if (empty(inst.destination)) {
      return errors;
    }

    const destinationResult = this.checkExpr(inst.destination);
    if (!coerce(destinationResult.type, stringType)) {
      errors.push(new KsTypeError(
        inst.destination, 'Can only compile to a string or bare path. ' +
        'This may not able to be coerced into string type',
        []));
    }

    return errors.concat(destinationResult.errors);
  }
  public visitList(inst: Inst.List): TypeErrors {
    const { target, collection } = inst;
    if (empty(target) || empty(collection)) {
      return [];
    }

    let finalType: IArgumentType;

    const errors: TypeErrors = [];
    switch (collection.lexeme) {
      case 'bodies':
        finalType = bodyTargetType;
        break;
      case 'targets':
        finalType = vesselTargetType;
        break;
      case 'resources':
      case 'parts':
      case 'engines':
      case 'sensors':
      case 'elements':
      case 'dockingports':
        finalType = partType;
        break;
      case 'files':
        finalType = volumeItemType;
        break;
      case 'volumes':
        finalType = volumeType;
        break;
      case 'processors':
        finalType = partModuleFieldsType;
        break;
      default:
        finalType = structureType;
        errors.push(new KsTypeError(collection, 'Not a valid list identifier', []));
    }

    this.symbolTable.setType(target, listType.toConcreteType(finalType));
    return errors;
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
  public visitExprInvalid(_: Expr.Invalid): ITypeResultExpr<IArgumentType> {
    return { type: structureType, errors: [] };
  }

  // ----------------------------- Expressions -----------------------------------------

  public visitBinary(expr: Expr.Binary): ITypeResultExpr<IArgumentType> {
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

  public visitUnary(expr: Expr.Unary): ITypeResultExpr<IArgumentType> {
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
  public visitFactor(expr: Expr.Factor): ITypeResultExpr<IArgumentType> {
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

  public visitSuffix(expr: Expr.Suffix): ITypeResultExpr<IArgumentType> {
    const { suffixTerm, trailer } = expr;
    const [firstTrailer, ...remainingTrailers] = suffixTerm.trailers;

    const atom = firstTrailer instanceof SuffixTerm.Call
      ? this.resolveAtom(suffixTerm.atom, KsSymbolKind.function)
      : this.resolveAtom(
        suffixTerm.atom, KsSymbolKind.variable,
        KsSymbolKind.lock, KsSymbolKind.parameter);
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

  public visitAnonymousFunction(_: Expr.AnonymousFunction): ITypeResultExpr<IArgumentType> {
    return this.resultExpr(delegateType);
  }

  // ----------------------------- Suffix -----------------------------------------

  private resolveAtom(
    atom: Atom,
    ...symbolKinds: KsSymbolKind[])
    : ITypeResultSuffix<IArgumentType | IFunctionType, ITypeResolved> {
    if (atom instanceof SuffixTerm.Literal) {
      return this.resolveLiteral(atom);
    }

    if (atom instanceof SuffixTerm.Identifier) {
      return this.resolveIdentifier(atom, symbolKinds);
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
        return this.resultAtom(booleanType, literal, KsSymbolKind.variable);
      case TokenType.integer:
        return this.resultAtom(integarType, literal, KsSymbolKind.variable);
      case TokenType.double:
        return this.resultAtom(doubleType, literal, KsSymbolKind.variable);
      case TokenType.string:
      case TokenType.fileIdentifier:
        return this.resultAtom(stringType, literal, KsSymbolKind.variable);
      default:
        throw new Error('Unknown literal type');
    }
  }

  private resolveIdentifier(
    identifer: SuffixTerm.Identifier,
    symbolKinds: KsSymbolKind[])
    : ITypeResultSuffix<IArgumentType | IFunctionType, ITypeResolved> {
    const type = this.symbolTable.getType(identifer.token, ...symbolKinds);
    const tracker = this.symbolTable.scopedSymbolTracker(
      identifer.start, identifer.token.lexeme, symbolKinds);
    return (empty(type) || empty(tracker))
      ? this.errorsAtom(
        identifer,
        new KsTypeError(identifer, 'Unable to lookup identifier type', []))
      : this.resultAtom(type, identifer, tracker.declared.symbol.tag);
  }

  private resolveGrouping(grouping: SuffixTerm.Grouping)
    : ITypeResultSuffix<IArgumentType, ITypeResolved> {
    const result = this.checkExpr(grouping.expr);
    return this.resultAtom(result.type, grouping, KsSymbolKind.variable, result.errors);
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
      return {
        ...callResult,
        resolved: {
          ...callResult.resolved,
          atomType: KsSymbolKind.function,
        },
      };
    }

    // handle normal functions
    const callResult = this.resolveNormalCall(type.params, { type, resolved, errors }, call);
    return {
      ...callResult,
      resolved: {
        ...callResult.resolved,
        atomType: KsSymbolKind.function,
      },
    };
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
      this.suffixTrailerResult(type, suffixTerm));
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

  /**
   * Visit a call expression and check for type errors
   * @param call the current call expresion
   * @param current current resolved suffix expression
   */
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

  /**
   * Resolve variadic call for type errors
   * @param params parameter types
   * @param current current resolved suffix expression
   * @param call current call expression
   */
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

  /**
   * Check a normal call signiture for type errors
   * @param params the parameter types
   * @param current the current resolved suffix
   * @param call the call expression
   */
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

  /**
   * visit an array index suffix expression.
   * @param suffixTerm the current array index
   * @param current the current type
   */
  public visitArrayIndex(
    suffixTerm: SuffixTerm.ArrayIndex,
    current: ITypeResultSuffix<IType>): ITypeResultSuffix<IArgumentType> {
    const { type, errors, resolved } = current;

    // TODO confirm indexable types
    // Only lists are indexable with '#'
    if (!coerce(type, userListType)) {
      return this.errorsSuffixTermTrailer(
        suffixTerm,
        resolved,
        errors,
        new KsTypeError(suffixTerm, 'indexing with # requires a list', []));
    }

    switch (suffixTerm.indexer.type) {
      // If index is integer we're already in good shape
      case TokenType.integer:
        return this.resultSuffixTermTrailer(arrayIndexer, suffixTerm, resolved, errors);

      // If index is identify check that it holds a integarType
      case TokenType.identifier:
        const type = this.symbolTable.getType(suffixTerm.indexer);
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

      // All other cases are unallowed
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

  /**
   * visit an array bracket suffix expression.
   * @param suffixTerm the current array bracket expression
   * @param current the current ytpe
   */
  public visitArrayBracket(
    suffixTerm: SuffixTerm.ArrayBracket,
    current: ITypeResultSuffix<IType>): ITypeResultSuffix<IArgumentType> {
    const { type, resolved, errors } = current;
    const indexResult = this.checkExpr(suffixTerm.index);

    // if we know the collection type is a list we need a scalar indexer
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

    // if we know the collection type is a lexicon we need a string indexer
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

    // if we know the collection type is a string we need a scalar indexer
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

  /**
   * visit the suffix term for delgates. This will return a new delgate type
   * @param suffixTerm the current delgate node
   * @param current the currently resolved type
   */
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

  /**
   * visit the suffix term for literals. This should not occur
   * @param _ literal syntax node
   * @param __ current type
   */
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
    leftResult: ITypeResultExpr<IType>,
    rightResult: ITypeResultExpr<IType>,
    operator: Operator): ITypeResultExpr<IArgumentType> {

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
    ...errors: (ITypeError | ITypeError[])[]): ITypeResultExpr<IArgumentType> {
    return this.resultExpr(structureType, ...errors);
  }

  /**
   * Return the resultant type with any errors
   * @param type current type
   * @param errors accumulated errors
   */
  private resultExpr<T extends IType>(
    type: T,
    ...errors: (ITypeError | ITypeError[])[]): ITypeResultExpr<T> {
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
    const { atom: current, termTrailers, suffixTrailer } = resolved;
    let returns = structureType;
    if (type.tag === 'function' || type.tag === 'suffix') {
      returns = type.returns;
    } else {
      returns = type;
    }

    return this.resultSuffixTerm(
      returns,
      { suffixTrailer, atom: current, termTrailers: [...termTrailers, new TypeNode(type, node)] },
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
   * Return the type result of the suffix term
   * @param type resultant type
   * @param resolved resolved cummulative suffix type
   * @param errors errors encounted while type checking
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

  /**
   * Return the atom error type
   * @param node suffix term node the error occured
   * @param errors errors encountered while checking this atom
   */
  private errorsAtom(
    node: SuffixTerm.SuffixTermBase,
    ...errors: (ITypeError | ITypeError[])[])
    : ITypeResultSuffix<IArgumentType, ITypeResolved> {
    return this.resultAtom(structureType, node, KsSymbolKind.variable, ...errors);
  }

  /**
   * Returns the result of an atom typecheck
   * @param type the current type of the atom
   * @param node node checked for this checking
   * @param atomType the symbol type of the atom
   * @param errors errors encountered during the checking
   */
  private resultAtom<T extends IType>(
    type: T,
    node: SuffixTerm.SuffixTermBase,
    atomType: KsSymbolKind,
    ...errors: (ITypeError | ITypeError[])[])
    : ITypeResultSuffix<T, ITypeResolved> {
    return {
      type,
      errors: ([] as ITypeError[]).concat(...errors),
      resolved: {
        atomType,
        atom: new TypeNode(type, node),
        termTrailers: [],
      },
    };
  }

  /**
   * New result for a new suffix trailer to fill in
   * @param type the type of the suffix expression so far
   * @param node the node the type was derived from
   */
  private suffixTrailerResult<T extends IType>(
    type: T,
    node: SuffixTerm.SuffixTermBase): ITypeResultSuffix<T, ITypeResolvedSuffix> {
    return {
      type,
      resolved: {
        atom: new TypeNode(type, node),
        termTrailers: ([] as ITypeNode<IType>[]),
      },
      errors: [],
    };
  }

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
