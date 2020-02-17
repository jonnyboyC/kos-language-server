import { Diagnostic } from 'vscode-languageserver';
import { SuffixTypeBuilder } from './models/suffixTypeNode';
import { Operator } from './models/types/operator';
import { TypeTracker } from '../analysis/models/typeTracker';

/**
 * type result for a kerboscript expression
 */
export interface ITypeResultExpr<T extends IType> {
  /**
   * result type
   */
  type: T;

  /**
   * errors encountered during this expression type check
   */
  errors: Diagnostic[];
}

/**
 * type result for a kerboscript suffix
 */
export interface ITypeResultSuffix<
  T extends SuffixTypeBuilder = SuffixTypeBuilder
> {
  /**
   * resolved cumulative suffix types
   */
  builder: T;

  /**
   * errors encountered during this suffix type check
   */
  errors: Diagnostic[];
}

/**
 * What is the kind of this type
 */
export const enum TypeKind {
  basic,
  variadic,
  suffix,
  indexer,
  delegate,
  grouping,
  function,
  typeSlot,
}

/**
 * What is the kind of this call
 */
export const enum CallKind {
  get,
  set,
  call,
  optionalCall,
}

/**
 * Construct a binary operation for a given type
 */
export interface BinaryConstructor {
  /**
   * What is the operator
   */
  operator:
    | OperatorKind.and
    | OperatorKind.or
    | OperatorKind.plus
    | OperatorKind.subtract
    | OperatorKind.multiply
    | OperatorKind.divide
    | OperatorKind.power
    | OperatorKind.greaterThan
    | OperatorKind.lessThan
    | OperatorKind.greaterThanEqual
    | OperatorKind.lessThanEqual
    | OperatorKind.notEqual
    | OperatorKind.equal;

  /**
   * What is the return type of this operator
   */
  returnType: IType;

  /**
   * What is the other type of the operator
   */
  other: IType;
}

/**
 * Construct a unary operation for a given type
 */
export interface UnaryConstructor {
  /**
   * What is the operator
   */
  operator: OperatorKind.negate;

  /**
   * What is the return type of this operator
   */
  returnType: IType;

  /**
   * What is the other type of this operator
   */
  other: undefined;
}

/**
 * What operator kind is present
 */
export enum OperatorKind {
  not,
  defined,
  negate,
  and,
  or,
  plus,
  subtract,
  multiply,
  divide,
  power,
  greaterThan,
  lessThan,
  greaterThanEqual,
  lessThanEqual,
  notEqual,
  equal,
}

/**
 * interface for an entity with type parameters that may need to be
 * mapped to another entity
 */
export interface ITypeMappable<T = {}> {
  /**
   * name of this mappable type
   */
  readonly name: string;

  /**
   * Get type parameters
   */
  getTypeParameters(): IParametricType[];

  /**
   * Apply type arguments to this parametric type to generate a new type
   * @param typeArgument type arguments to apply
   */
  apply(typeArgument: Map<IParametricType, IType> | IType): T;
}

/**
 * A parameterized type. These are used by Kerboscript's collection types
 */
export interface IParametricType extends ITypeMappable<IType> {
  /**
   * What access does this type possess
   */
  readonly access: Access;

  /**
   * Is this type an any type. i.e can it be used anywhere
   */
  readonly anyType: boolean;

  /**
   * Is this type the void type. i.e does it represent nothing
   */
  readonly noneType: boolean;

  /**
   * What is the kind of this type
   */
  readonly kind: TypeKind;

  /**
   * Is this type a subtype of some other parametric type
   * @param type parameter type to check
   */
  isSubtypeOf(type: IParametricType): boolean;

  /**
   * Can the this type be coerced from the provided type TODO invert this behavior
   * @param type the type to attempt to coerce from
   */
  canCoerceFrom(type: IParametricType): boolean;

  /**
   * Get the super type of this type
   */
  super(): Maybe<IParametricType>;

  /**
   * Sub types of this type
   */
  subTypes(): IParametricType[];

  /**
   * Get the coercions of this type
   */
  coercions(): Set<IParametricType>;

  /**
   * Get the call signature of this type
   */
  callSignature(): Maybe<IParametricCallSignature>;

  /**
   * Get the indexer for this type
   */
  indexer(): Maybe<IParametricIndexer>;

  /**
   * Get the suffixes for this type
   */
  suffixes(): Map<string, IParametricType>;

  /**
   * Get an operator of a specific kind for another type
   * @param kind operator kind
   * @param other other type if binary expression
   */
  getOperator(
    kind: OperatorKind,
    other?: IParametricType,
  ): Maybe<Operator<IParametricType>>;

  /**
   * Get the operators associated with this type
   */
  operators(): Map<OperatorKind, Operator<IParametricType>[]>;

  /**
   * Apply type arguments to this parametric type to generate a new type
   * @param typeArgument type arguments to apply
   */
  apply(typeArgument: Map<IParametricType, IType> | IType): IType;

  /**
   * Get a string representation of this type
   */
  toString(): string;
}

export interface IType extends IParametricType {
  /**
   * Is this type a subtype of some other parametric type
   * @param type parameter type to check
   */
  isSubtypeOf(type: IParametricType): boolean;

  /**
   * Get the assignment type of this type
   */
  assignmentType(): IType;

  /**
   * Get the super type of this type
   */
  super(): Maybe<IType>;

  /**
   * Sub types of this type
   */
  subTypes(): IType[];

  /**
   * Get the tracker for this type
   */
  tracker(): TypeTracker;

  /**
   * Get the call signature of this type
   */
  callSignature(): Maybe<ICallSignature>;

  /**
   * Get the indexer for this type
   */
  indexer(): Maybe<IIndexer>;

  /**
   * Get the suffixes for this type
   */
  suffixes(): Map<string, IType>;

  /**
   * Does this type have the requested suffix
   * @param name name of the suffix
   */
  hasSuffix(name: string): boolean;

  /**
   * Attempt to retrieve a suffix from this type
   * @param name name of the suffix
   */
  getSuffix(name: string): Maybe<IType>;

  /**
   * Get an operator of a specific kind for another type
   * @param kind operator kind
   * @param other other type if binary expression
   */
  getOperator(kind: OperatorKind, other?: IType): Maybe<Operator<IType>>;

  /**
   * Get the operators associated with this type
   */
  operators(): Map<OperatorKind, Operator<IType>[]>;
}

/**
 * A mapping of a provided type from one set of type parameters
 * to another
 */
export interface TypeMap<T extends ITypeMappable> {
  /**
   * Mapping to handle the analogous case in js of
   * `class Foo<T, K> extends Bar<K, T> {}`
   */
  mapping: Map<IParametricType, IParametricType>;

  /**
   * The type to have parameters mapped
   */
  type: T;
}

/**
 * Access level of a type
 */
export interface Access {
  /**
   * Is this type gettable
   */
  get: boolean;

  /**
   * Is this type settable
   */
  set: boolean;
}

/**
 * An interface representing a type's call signature with type parameters
 */
export interface IParametricCallSignature
  extends ITypeMappable<ICallSignature> {
  /**
   * The types of the parameters
   */
  params(): IParametricType[];

  /**
   * The required number of parameters
   */
  requiredParams(): number;

  /**
   * The type of the return
   */
  returns(): IParametricType;

  /**
   * Apply type arguments to this parametric call signature
   * @param typeArguments type arguments
   */
  apply(typeArguments: Map<IParametricType, IType> | IType): ICallSignature;

  /**
   * A string representation of this call signature
   */
  toString(): string;
}

/**
 * An interface representing a type's call signature
 */
export interface ICallSignature extends IParametricCallSignature {
  /**
   * The types of the parameters
   */
  params(): IType[];

  /**
   * The type of the return
   */
  returns(): IType;
}

/**
 * An interface representing a type's indexer
 */
export interface IParametricIndexer extends IParametricType {
  /**
   * What is the kind of this type
   */
  readonly kind: TypeKind.indexer;

  /**
   * Apply type arguments to this parametric type to generate a new type
   * @param typeArgument type arguments to apply
   */
  apply(typeArgument: Map<IParametricType, IType> | IType): IIndexer;
}

/**
 * An interface representing a type's indexer
 */
export interface IIndexer extends IType {
  /**
   * What is the kind of this type
   */
  readonly kind: TypeKind.indexer;

  /**
   * Apply type arguments to this parametric type to generate a new type
   * @param typeArgument type arguments to apply
   */
  apply(typeArgument: Map<IParametricType, IType> | IType): IIndexer;
}
