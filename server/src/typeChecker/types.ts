import { Diagnostic } from 'vscode-languageserver';
import { SuffixTypeBuilder } from './suffixTypeNode';
import { Operator } from './operator';
import { TypeParameter } from './typeParameter';
import { TypeTracker } from '../analysis/typeTracker';

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
  function,
  typePlaceholder,
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

export interface IGenericType {
  readonly name: string;
  readonly access: Access;
  readonly callSignature?: CallSignature<IGenericType>;
  readonly kind: TypeKind;
  addSuper(
    type: IGenericType,
    typeParameterLink?: Map<TypeParameter, TypeParameter>,
  ): void;
  addCoercion(...types: IGenericType[]): void;
  addSuffixes(...suffixes: IGenericType[]): void;
  addOperators(...operators: Operator<IGenericType>[]): void;
  isSubtypeOf(type: IGenericType): boolean;
  canCoerceFrom(type: IGenericType): boolean;
  getTypeParameters(): TypeParameter[];
  getSuperType(): Maybe<IGenericType>;
  getCoercions(): Set<IGenericType>;
  getSuffix(name: string): Maybe<IGenericType>;
  getSuffixes(): Map<string, IGenericType>;
  getOperator(
    kind: OperatorKind,
    other?: IGenericType,
  ): Maybe<Operator<IGenericType>>;
  getOperators(): Map<OperatorKind, Operator<IGenericType>[]>;
  toTypeString(): string;
  toConcreteType(typeArguments: Map<string, IType> | IType): IType;
}

export interface IType extends IGenericType {
  typeArguments: Map<string, IType>;
  readonly anyType: boolean;
  readonly callSignature?: CallSignature<IType>;
  addSuper(
    type: IType,
    typeParameterLink?: Map<TypeParameter, TypeParameter>,
  ): void;
  addCoercion(...types: IType[]): void;
  addSuffixes(...suffixes: IType[]): void;
  addOperators(...operators: Operator<IType>[]): void;
  isSubtypeOf(type: IType): boolean;
  canCoerceFrom(type: IType): boolean;
  getAssignmentType(): IType;
  getTypeParameters(): TypeParameter[];
  getSuperType(): Maybe<IType>;
  getTracker(): TypeTracker;
  getCoercions(): Set<IType>;
  getSuffix(name: string): Maybe<IType>;
  getSuffixes(): Map<string, IType>;
  getOperator(kind: OperatorKind, other?: IType): Maybe<Operator<IType>>;
  getOperators(): Map<OperatorKind, Operator<IType>[]>;
  toTypeString(): string;
  toConcreteType(typeArguments: Map<string, IType> | IType): IType;
}

export interface Access {
  get: boolean;
  set: boolean;
}

export interface CallSignature<T extends IGenericType = IType> {
  params: T[];
  returns: T;
}
