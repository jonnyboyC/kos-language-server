import { empty } from '../../utilities/typeGuards';
import {
  IGenericArgumentType,
  IArgumentType,
  IGenericSuffixType,
  IGenericVariadicType,
  CallType,
  IGenericBasicType,
  IConstantType,
  IBasicType,
  ISuffixType,
  IVariadicType,
  IFunctionType,
  Operator,
  TypeKind,
} from './types';
import { memoize } from '../../utilities/memoize';

/**
 * This represents a generic type, typically the containers of kos
 */
export class GenericType implements IGenericBasicType {

  /**
   * A memoized mapping of this genertic type to concrete types
   */
  private concreteTypes: Map<IArgumentType, IBasicType>;

  /**
   * Operators that are applicable for this type
   */
  public operators: Map<Operator, IBasicType>;

  /**
   * Suffixes attach to this type
   */
  public suffixes: Map<string, IGenericSuffixType>;

  /**
   * Does this type inherent from another type
   */
  public inherentsFrom?: IGenericArgumentType;

  /**
   * Constructor a generic type
   * @param name name of generic type
   */
  constructor(public readonly name: string) {
    this.suffixes = new Map();
    this.concreteTypes = new Map();
    this.operators = new Map();
  }

  /**
   * Convert this type into a type string
   */
  public toTypeString(): string {
    return `${this.name}<T>`;
  }

  /**
   * Convert this type into it's concrete representation
   * @param type type parameter
   */
  public toConcreteType(type: IArgumentType): IArgumentType {
    if (this === tType) {
      return type;
    }

    // check cache
    const cache = this.concreteTypes.get(type);
    if (!empty(cache)) {
      return cache;
    }

    const newType = new Type(this.name);
    this.concreteTypes.set(type, newType);

    const newInherentsFrom = !empty(this.inherentsFrom)
      ? this.inherentsFrom.toConcreteType(type)
      : undefined;

    // add suffixes and prototype
    for (const [name, suffixType] of this.suffixes.entries()) {
      newType.suffixes.set(name, suffixType.toConcreteType(type));
    }
    newType.operators = new Map(this.operators);
    newType.inherentsFrom = newInherentsFrom;

    return newType;
  }

  /**
   * Is this a full type
   */
  public get fullType(): boolean {
    return false;
  }

  /**
   * What is the type kind of this type
   */
  public get kind(): TypeKind.basic {
    return TypeKind.basic;
  }
}

/**
 * This represents a generic suffix type, typically suffixes of containers in kos
 */
export class GenericSuffixType implements IGenericSuffixType {

  /**
   * A memoized mapping of this genertic type to concrete types
   */
  private concreteTypes: Map<IArgumentType, ISuffixType>;

  /**
   * Construct a generic suffix type
   * @param name name of the type
   * @param callType call type of this suffix
   * @param params parameters for this suffix
   * @param returns return type of this suffix
   */
  constructor(
    public readonly name: string,
    public readonly callType: CallType,
    public readonly params: IGenericArgumentType[] | IGenericVariadicType,
    public readonly returns: IGenericArgumentType,
  ) {
    this.concreteTypes = new Map();
  }

  /**
   * Convert this type to a type string
   */
  public toTypeString(): string {
    const returnString = returnTypeString(this.returns);
    if (this.callType !== CallType.call && this.callType !== CallType.optionalCall) {
      return returnString;
    }

    const paramsString = parameterTypeString(this.params);
    return `<T>(${paramsString}) => ${returnString}`;
  }

  /**
   * Convert this type into it's concrete representation
   * @param type type parameter
   */
  public toConcreteType(type: IArgumentType): ISuffixType {
    // check cache
    const cache = this.concreteTypes.get(type);
    if (!empty(cache)) {
      return cache;
    }

    // generate concete parameters
    const newParams = this.newParameters(this.params, type);

    // generate concrete return
    const newReturns = this.returns.toConcreteType(type);
    const newType = new SuffixType(this.name, this.callType, newParams, newReturns);

    this.concreteTypes.set(type, newType);
    return newType;
  }

  /**
   * Is this type a full type
   */
  public get fullType(): boolean {
    return false;
  }

  /**
   * What is the kind of this type
   */
  public get kind(): TypeKind.suffix {
    return TypeKind.suffix;
  }

  /**
   * Generate new parameters types for suffixes with calls
   * @param params parameters to convert to concrete types
   * @param type type parameter
   */
  private newParameters(params: IGenericArgumentType[] | IGenericVariadicType, type: IArgumentType):
    IArgumentType[] | IVariadicType {

    // check if variadic type
    if (!Array.isArray(params)) {
      return params.toConcreteType(type);
    }

    const newParams: IArgumentType[] = [];
    for (const param of params) {
      newParams.push(param.toConcreteType(type));
    }

    return newParams;
  }
}

/**
 * This represents a type
 */
export class Type implements IBasicType {

  /**
   * Suffixes attach to this type
   */
  public suffixes: Map<string, ISuffixType>;

  /**
   * Does this type inherent from another type
   */
  public inherentsFrom?: IArgumentType;

  /**
   * Operators that are applicable for this type
   */
  public operators: Map<Operator, IBasicType>;

  /**
   * Type constructor
   * @param name name of the new type
   */
  constructor(public readonly name: string) {
    this.suffixes = new Map();
    this.operators = new Map();
  }

  /**
   * Convert this type into it's concrete representation
   * @param _ type parameter
   */
  public toConcreteType(_: IArgumentType): IArgumentType {
    return this;
  }

  /**
   * Convert this type into a type string
   */
  public toTypeString(): string {
    return this.name;
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
   * Construct a suffix type
   * @param name name of the type
   * @param callType call type of this suffix
   * @param params parameters for this suffix
   * @param returns return type of this suffix
   */
  constructor(
    public readonly name: string,
    public readonly callType: CallType,
    public readonly params: IArgumentType[] | IVariadicType,
    public readonly returns: IArgumentType) {
  }

  /**
   * Generate the type string for this suffix type
   */
  public toTypeString(): string {
    const returnString = returnTypeString(this.returns);
    if (this.callType !== CallType.call && this.callType !== CallType.optionalCall) {
      return returnString;
    }

    const paramsString = parameterTypeString(this.params);
    return `(${paramsString}) => ${returnString}`;
  }

  /**
   * Convert this type into it's concrete representation
   * @param _ type parameter
   */
  public toConcreteType(_: IArgumentType): ISuffixType {
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
}

/**
 * Represents a constant type, or a type with a fixed value
 */
export class ConstantType<T> extends Type implements IConstantType<T> {

  /**
   * Construct a constant type
   * @param name name of this constant type
   * @param value value of this constant type
   */
  constructor(name: string, public readonly value: T) {
    super(name);
  }

  /**
   * Create a type string from this type
   */
  public toTypeString(): string {
    return `${super.toTypeString()} = ${this.value}`;
  }
}

export class GenericVariadicType implements IGenericVariadicType {
  private concreteTypes: Map<IArgumentType, IVariadicType>;

  constructor(public readonly type: IGenericBasicType) {
    this.concreteTypes = new Map();
  }
  public toTypeString(): string {
    return `...${this.type.toTypeString()}[]`;
  }
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
  public get kind(): TypeKind.variadic {
    return TypeKind.variadic;
  }
}

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
    public readonly callType: CallType.call | CallType.optionalCall,
    public readonly params: IArgumentType[] | IVariadicType,
    public readonly returns: IArgumentType)
  { }

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
  return empty(returns)
    ? 'void'
    : returns.toTypeString();
};

const parameterTypeString = (params: IGenericArgumentType[] | IGenericVariadicType) => {
  // empty string for no params
  if (empty(params)) {
    return '';
  }

  // check if variadic type
  if (!Array.isArray(params)) {
    return params.toTypeString();
  }

  // string separated i
  return params
    .map(param => param.toTypeString())
    .join(', ');
};

export const createGenericStructureType = (name: string):
  IGenericArgumentType => {
  return new GenericType(name);
};

export const getTypeParameter = memoize((name: string): IGenericBasicType => {
  return createGenericStructureType(name);
});

export const tType = getTypeParameter('T');

export const createStructureType = (name: string): IBasicType => {
  return new Type(name);
};

export const createGenericArgSuffixType = (
  name: string,
  returns: IGenericArgumentType,
  ...params: IGenericArgumentType[]): IGenericSuffixType => {
  const callType = params.length > 0
    ? CallType.call
    : CallType.optionalCall;

  return new GenericSuffixType(
    name.toLowerCase(), callType,
    params, returns);
};

export const createArgSuffixType = (
  name: string,
  returns: IArgumentType,
  ...params: IArgumentType[]): ISuffixType => {
  const callType = params.length > 0
    ? CallType.call
    : CallType.optionalCall;

  return new SuffixType(
    name.toLowerCase(), callType,
    params, returns);
};

export const createSuffixType = (name: string, returns: IArgumentType): ISuffixType => {
  return new SuffixType(name.toLowerCase(), CallType.get, [], returns);
};

export const createSetSuffixType = (name: string, returns: IArgumentType): ISuffixType => {
  return new SuffixType(name.toLowerCase(), CallType.set, [], returns);
};

export const createVarSuffixType = (
  name: string,
  returns: IArgumentType,
  params: IVariadicType): ISuffixType => {
  return new SuffixType(name.toLowerCase(), CallType.optionalCall, params, returns);
};

export const createFunctionType = (
  name: string,
  returns: IArgumentType,
  ...params: IArgumentType[]): IFunctionType => {
  const callType = params.length > 0
    ? CallType.call
    : CallType.optionalCall;

  return new FunctionType(name.toLowerCase(), callType, params, returns);
};

export const createVarFunctionType = (
  name: string,
  returns: IArgumentType,
  params: IVariadicType): IFunctionType => {
  return new FunctionType(name.toLowerCase(), CallType.optionalCall, params, returns);
};
