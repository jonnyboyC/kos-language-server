import { empty } from '../utilities/typeGuards';
import {
  IGenericArgumentType,
  ArgumentType,
  IGenericSuffixType,
  IGenericVariadicType,
  IGenericBasicType,
  IConstantType,
  IBasicType,
  ISuffixType,
  IVariadicType,
  IFunctionType,
} from './types/types';
import { SuffixTracker } from '../analysis/suffixTracker';
import { KsSuffix } from '../entities/suffix';
import { tType } from './typeCreators';
import { OperatorKind, TypeKind, CallKind } from './types';
import { Operator } from './operator';

/**
 * This represents a generic type, typically the containers of kos
 */
export class GenericBasicType implements IGenericBasicType {
  /**
   * A memoized mapping of this genertic type to concrete types
   */
  private concreteTypes: Map<ArgumentType, IBasicType>;

  /**
   * Operators that are applicable for this type
   */
  public operators: Map<OperatorKind, Operator[]>;

  /**
   * Suffixes attach to this type
   */
  public suffixes: Map<string, IGenericSuffixType>;

  /**
   * Is this type a subtype of another type
   */
  public superType?: IGenericArgumentType;

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
  public toConcreteType(type: ArgumentType): ArgumentType {
    if (this === tType) {
      return type;
    }

    // check cache
    const cache = this.concreteTypes.get(type);
    if (!empty(cache)) {
      return cache;
    }

    const newType = new BasicType(this.name, [type]);
    this.concreteTypes.set(type, newType);

    const newInherentsFrom = !empty(this.superType)
      ? this.superType.toConcreteType(type)
      : undefined;

    // add suffixes and prototype
    for (const [name, suffixType] of this.suffixes.entries()) {
      newType.suffixes.set(name, suffixType.toConcreteType(type));
    }
    newType.operators = new Map(this.operators);
    newType.superType = newInherentsFrom;

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
  private concreteTypes: Map<ArgumentType, ISuffixType>;

  /**
   * Construct a generic suffix type
   * @param name name of the type
   * @param callType call type of this suffix
   * @param params parameters for this suffix
   * @param returns return type of this suffix
   */
  constructor(
    public readonly name: string,
    public readonly callType: CallKind,
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
    if (
      this.callType !== CallKind.call &&
      this.callType !== CallKind.optionalCall
    ) {
      return returnString;
    }

    const paramsString = parameterTypeString(this.params);
    return `<T>(${paramsString}) => ${returnString}`;
  }

  /**
   * Convert this type into it's concrete representation
   * @param type type parameter
   */
  public toConcreteType(type: ArgumentType): ISuffixType {
    // check cache
    const cache = this.concreteTypes.get(type);
    if (!empty(cache)) {
      return cache;
    }

    // generate concete parameters
    const newParams = this.newParameters(this.params, type);

    // generate concrete return
    const newReturns = this.returns.toConcreteType(type);
    const newType = new SuffixType(
      this.name,
      this.callType,
      newParams,
      newReturns,
      [type],
    );

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
  private newParameters(
    params: IGenericArgumentType[] | IGenericVariadicType,
    type: ArgumentType,
  ): ArgumentType[] | IVariadicType {
    // check if variadic type
    if (!Array.isArray(params)) {
      return params.toConcreteType(type);
    }

    const newParams: ArgumentType[] = [];
    for (const param of params) {
      newParams.push(param.toConcreteType(type));
    }

    return newParams;
  }
}

/**
 * This represents a type
 */
export class BasicType implements IBasicType {
  /**
   * Name of the type
   */
  public readonly name: string;

  /**
   * Suffixes attach to this type
   */
  public suffixes: Map<string, ISuffixType>;

  /**
   * Operators that are applicable for this type
   */
  public operators: Map<OperatorKind, Operator[]>;

  /**
   * Is this type a subtype of another type
   */
  public superType?: ArgumentType;

  /**
   * type paremters for this type
   */
  private typeParameters: ArgumentType[];

  /**
   * Type constructor
   * @param name name of the new type
   * @param typeParameters type parameters of this type
   */
  constructor(name: string, typeParameters: ArgumentType[]) {
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

    const typeParameterStr = this.typeParameters.map(t => t.toTypeString()).join(', ');
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
    const typeParameterStr = this.typeParameters.length > 0
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
