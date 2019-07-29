import { empty } from '../utilities/typeGuards';
import { SuffixTracker } from '../analysis/suffixTracker';
import { KsSuffix } from '../entities/suffix';
import { tType } from './typeCreators';
import { TypeSubstitution } from './typeSubstitution';
import {
  OperatorKind,
  TypeKind,
  CallKind,
  IGenericType,
  Access,
  CallSignature,
  IType,
} from './types';
import { Operator } from './operator';
import { TypeParameter } from './typeParameter';

export class GenericType implements IGenericType {
  public readonly name: string;
  public readonly access: Access;
  public readonly callSignature?: CallSignature;
  public readonly kind: TypeKind;

  private superType?: IGenericType;
  private substitution: TypeSubstitution;
  private coercibleTypes: Set<IGenericType>;
  private suffixes: Map<string, IGenericType>;
  private operators: Map<OperatorKind, Operator<IGenericType>[]>;

  constructor(
    name: string,
    access: Access,
    typeParameters: Set<TypeParameter>,
    kind: TypeKind,
    callSignature?: CallSignature,
  ) {
    this.name = name;
    this.access = access;
    this.callSignature = callSignature;
    this.kind = kind;
    this.substitution = new TypeSubstitution(typeParameters);
    this.coercibleTypes = new Set();
    this.suffixes = new Map();
    this.operators = new Map();
  }

  public addSuper(type: IGenericType): void {
    if (!empty(this.superType)) {
      throw new Error(`Super type for ${this.name} has already been set.`);
    }

    this.superType = type;
  }

  public addCoercion(type: IGenericType): void {
    if (this.coercibleTypes.has(type)) {
      throw new Error(
        `Coercible type ${type.name} has already been added to ${this.name}`,
      );
    }

    this.coercibleTypes.add(type);
  }

  public addSuffixes(...suffixes: [string, IGenericType][]): void {
    for (const [name, type] of suffixes) {
      if (this.suffixes.has(name)) {
        throw new Error(`Duplicate suffix of ${name} added to ${this.name}`);
      }

      this.suffixes.set(name, type);
    }
  }

  public addOperator(
    ...operators: [OperatorKind, Operator<IGenericType>][]
  ): void {
    for (const [kind, operator] of operators) {
      if (!this.operators.has(kind)) {
        this.operators.set(kind, []);
      }

      const operatorsKind = this.operators.get(kind);

      // should never happen
      if (empty(operatorsKind)) {
        throw new Error(
          `Operator kind ${OperatorKind[kind]} not found for ${this.name}`,
        );
      }

      // check to make sure we didn't add two operators with the same
      // other operand
      for (const existingOperator of operatorsKind) {
        if (existingOperator.otherOperand === operator.otherOperand) {
          let message: string;
          const { otherOperand } = existingOperator;
          if (empty(otherOperand)) {
            message =
              `Operator of kind ${OperatorKind[kind]}` +
              ` already exists between for ${this.name}`;
          } else {
            message =
              `Operator of kind ${OperatorKind[kind]} already exists between` +
              ` ${this.name} and ${otherOperand.name}`;
          }

          throw new Error(message);
        }
      }

      operatorsKind.push(operator);
    }
  }

  public isSubtype(type: IGenericType): boolean {
    if (type === this) {
      return true;
    }

    return empty(this.superType) ? false : this.superType.isSubtype(type);
  }
  public canCoerce(type: IGenericType): boolean {
    if (type === this) {
      return true;
    }

    if (this.coercibleTypes.has(type)) {
      return true;
    }

    return empty(this.superType) ? false : this.superType.canCoerce(type);
  }

  public getTypeParameters(): TypeParameter[] {
    return [...this.substitution.typeParameters];
  }

  public getSuperType(): IGenericType | undefined {
    return this.superType;
  }

  public getCoercions(): Set<IGenericType> {
    return this.coercibleTypes;
  }

  public getSuffix(name: string): IGenericType | undefined {
    const suffix = this.suffixes.get(name);
    if (!empty(suffix)) {
      return suffix;
    }

    return empty(this.superType) ? undefined : this.superType.getSuffix(name);
  }

  public getSuffixes(): Map<string, IGenericType> {
    const suffixes = new Map(this.suffixes.entries());

    if (!empty(this.superType)) {
      for (const [key, value] of this.superType.getSuffixes()) {
        suffixes.set(key, value);
      }
    }

    return suffixes;
  }

  public getOperator(
    kind: OperatorKind,
    other?: IGenericType,
  ): Maybe<Operator<IGenericType>> {
    const operators = this.operators.get(kind);

    if (empty(operators)) {
      return operators;
    }

    for (const operator of operators) {
      // check if operator is unary other see if it can coerced into other operand
      if (empty(operator.otherOperand)) {
        if (empty(other)) {
          return operator;
        }
      } else if (!empty(other) && operator.otherOperand.canCoerce(other)) {
        return operator;
      }
    }

    return undefined;
  }

  public getOperators(): Map<OperatorKind, Operator<IGenericType>[]> {
    return this.operators;
  }

  public toTypeString(): string {
    const typeParameters = this.getTypeParameters();

    const typeParameterStr =
      typeParameters.length > 0
        ? `<${typeParameters.map(t => t.toTypeString()).join(', ')}>`
        : '';

    if (empty(this.callSignature)) {
      return `${this.name}${typeParameterStr}`;
    }

    return this.callToTypeString(this.callSignature, typeParameterStr);
  }

  private callToTypeString(
    callSignature: CallSignature,
    typeParameterStr: string,
  ): string {
    const paramsStr = callSignature.params
      .map(p => p.toTypeString())
      .join(', ');
    return `${typeParameterStr}(${paramsStr}) => ${callSignature.returns.toTypeString()}`;
  }

  public toConcreteType(typeArguments: Map<TypeParameter, IType>): IType {
    return this.substitution.substitute(this, typeArguments);
  }
}

/**
 * This represents a type
 */
export class Type implements IType {
  typeArguments: Map<TypeParameter, IType>;
  addSuper(type: IType): void {
    throw new Error('Method not implemented.');
  }
  addCoercion(...types: IType[]): void {
    throw new Error('Method not implemented.');
  }
  addSuffixes(...suffixes: [string, IType][]): void {
    throw new Error('Method not implemented.');
  }
  addOperator(...operators: [OperatorKind, Operator<IType>][]): void {
    throw new Error('Method not implemented.');
  }
  isSubtype(type: IType): boolean {
    throw new Error('Method not implemented.');
  }
  canCoerce(type: IType): boolean {
    throw new Error('Method not implemented.');
  }
  getTypeParameters(): TypeParameter[] {
    throw new Error('Method not implemented.');
  }
  getSuperType(): Maybe<IType> {
    throw new Error('Method not implemented.');
  }
  getCoercions(): Set<IType> {
    throw new Error('Method not implemented.');
  }
  getSuffix(name: string): Maybe<IType> {
    throw new Error('Method not implemented.');
  }
  getSuffixes(): Map<string, IType> {
    throw new Error('Method not implemented.');
  }
  getOperator(
    kind: OperatorKind,
    other?: Maybe<IType>,
  ): Maybe<Operator<IType>> {
    throw new Error('Method not implemented.');
  }
  getOperators(): Map<OperatorKind, Operator<IType>[]> {
    throw new Error('Method not implemented.');
  }
  access: Access;
  callSignature?: CallSignature<IGenericType> | undefined;

  /**
   * A memoized mapping of this generic type to concrete types
   */
  private concreteTypes: Map<IGenericType, IGenericType>;

  /**
   * Name of the type
   */
  public readonly name: string;

  /**
   * Suffixes attach to this type
   */
  private suffixes: Map<string, IGenericType>;

  /**
   * Operators that are applicable for this type
   */
  private operators: Map<OperatorKind, Operator[]>;

  /**
   * Is this type a subtype of another type
   */
  private superType?: IGenericType;

  /**
   * type parameters for this type
   */
  public typeParameters: Map<IGenericType, Maybe<IGenericType>>;

  /**
   * Type constructor
   * @param name name of the new type
   * @param typeParameters type parameters of this type
   */
  constructor(
    name: string,
    access: Access,
    typeArguments: Map<TypeParameter, IType>,
    kind: TypeKind,
    callSignature?: CallSignature,
  ) {
    this.name = name;
    this.typeParameters = typeParameters;
    this.suffixes = new Map();
    this.operators = new Map();
  }

  /**
   * Convert this type into it's concrete representation
   * @param _ type parameter
   */
  public toConcreteType(_: ArgumentType): ArgumentType {
    return this;
  }

  /**
   * Convert this type into a type string
   */
  public toTypeString(): string {
    if (this.typeParameters.length === 0) {
      return this.name;
    }

    const typeParameterStr = this.typeParameters
      .map(t => t.toTypeString())
      .join(', ');
    return `${this.name}<${typeParameterStr}>`;
  }

  /**
   * Is this a full type
   */
  public get fullType(): true {
    return true;
  }

  /**
   * What is the kind of this type
   */
  public get kind(): TypeKind.basic {
    return TypeKind.basic;
  }
}

/**
 * This represents a suffix type
 */
export class SuffixType implements ISuffixType {
  /**
   * The suffix tracker for this type
   */
  private tracker: SuffixTracker;

  /**
   * Construct a suffix type
   * @param name name of the type
   * @param callType call type of this suffix
   * @param params parameters for this suffix
   * @param returns return type of this suffix
   * @param typeParameters type parameters of this type
   */
  constructor(
    public readonly name: string,
    public readonly callType: CallKind,
    public readonly params: ArgumentType[] | IVariadicType,
    public readonly returns: ArgumentType,
    public readonly typeParameters: ArgumentType[],
  ) {
    this.tracker = new SuffixTracker(new KsSuffix(name), this);
  }

  /**
   * Generate the type string for this suffix type
   */
  public toTypeString(): string {
    const typeParameterStr =
      this.typeParameters.length > 0
        ? `<${this.typeParameters.map(t => t.toTypeString()).join(', ')}>`
        : '';

    const returnString = returnTypeString(this.returns);
    if (
      this.callType !== CallKind.call &&
      this.callType !== CallKind.optionalCall
    ) {
      return `${typeParameterStr}${returnString}`;
    }

    const paramsString = parameterTypeString(this.params);
    return `${typeParameterStr}(${paramsString}) => ${returnString}`;
  }

  /**
   * Convert this type into it's concrete representation
   * @param _ type parameter
   */
  public toConcreteType(_: ArgumentType): ISuffixType {
    return this;
  }

  /**
   * Is this a full type
   */
  public get fullType(): true {
    return true;
  }

  /**
   * What is the kind of this type
   */
  public get kind(): TypeKind.suffix {
    return TypeKind.suffix;
  }

  getTracker(): SuffixTracker {
    return this.tracker;
  }
}

/**
 * Represents a constant type, or a type with a fixed value
 */
export class ConstantType<T> extends BasicType implements IConstantType<T> {
  /**
   * Construct a constant type
   * @param name name of this constant type
   * @param value value of this constant type
   */
  constructor(name: string, public readonly value: T) {
    super(name, []);
  }

  /**
   * Create a type string from this type
   */
  public toTypeString(): string {
    return `${super.toTypeString()} = ${this.value}`;
  }
}

/**
 * Represents a generic variadic type, typically for functions that take an
 * unspecified number of the same parameter.
 */
export class GenericVariadicType implements IGenericVariadicType {
  /**
   * A memoized mapping of this genertic type to concrete types
   */
  private concreteTypes: Map<ArgumentType, IVariadicType>;

  /**
   * Construct a generic variadic type
   * @param type type parameter
   */
  constructor(public readonly type: IGenericBasicType) {
    this.concreteTypes = new Map();
  }

  /**
   * Convert this type to a type string
   */
  public toTypeString(): string {
    return `...${this.type.toTypeString()}[]`;
  }

  /**
   * Convert this type into it's concrete representation
   * @param type type parameter
   */
  public toConcreteType(type: IBasicType): IVariadicType {
    // check cache
    const cache = this.concreteTypes.get(type);
    if (!empty(cache)) {
      return cache;
    }

    const newType = new VariadicType(type);
    this.concreteTypes.set(type, newType);
    return newType;
  }

  /**
   * What is the kind of this type
   */
  public get kind(): TypeKind.variadic {
    return TypeKind.variadic;
  }
}

/**
 * Represent a variadictype, typically for functions that take an
 * unspecified number of the same parameter.
 */
export class VariadicType extends GenericVariadicType implements IVariadicType {
  constructor(public readonly type: IBasicType) {
    super(type);
  }
  public toConcreteType(_: IBasicType): IVariadicType {
    return this;
  }
  public get fullType(): true {
    return true;
  }
  public get kind(): TypeKind.variadic {
    return TypeKind.variadic;
  }
}

export class FunctionType implements IFunctionType {
  constructor(
    public readonly name: string,
    public readonly callType: CallKind.call | CallKind.optionalCall,
    public readonly params: ArgumentType[] | IVariadicType,
    public readonly returns: ArgumentType,
  ) {}

  public toTypeString(): string {
    const returnString = returnTypeString(this.returns);
    const paramsString = parameterTypeString(this.params);

    return `(${paramsString}) => ${returnString}`;
  }

  public toConcreteType(_: IBasicType): IFunctionType {
    return this;
  }

  public get kind(): TypeKind.function {
    return TypeKind.function;
  }

  public get fullType(): true {
    return true;
  }
}

const returnTypeString = (returns?: IGenericArgumentType) => {
  return empty(returns) ? 'void' : returns.toTypeString();
};

const parameterTypeString = (
  params: IGenericArgumentType[] | IGenericVariadicType,
) => {
  // empty string for no params
  if (empty(params)) {
    return '';
  }

  // check if variadic type
  if (!Array.isArray(params)) {
    return params.toTypeString();
  }

  // string separated i
  return params.map(param => param.toTypeString()).join(', ');
};
