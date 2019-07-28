import { Diagnostic } from 'vscode-languageserver';
import { SuffixTypeBuilder } from './suffixTypeNode';
import { Operator } from './operator';
import { TypeParameter } from './typeParameter';

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
  readonly callSignature?: CallSignature;
  readonly kind: TypeKind;
  addSuper(type: IGenericType): void;
  addSuffixes(...suffixes: [string, IGenericType][]): void;
  addOperator(...operators: [OperatorKind, Operator<IGenericType>][]): void;
  getTypeParameters(): Set<TypeParameter>;
  isSubtype(type: IGenericType): boolean;
  canCoerce(type: IGenericType): boolean;
  getSuperType(): Maybe<IGenericType>;
  getSuffix(name: string): Maybe<IGenericType>;
  getSuffixes(): IGenericType[];
  getOperator(
    kind: OperatorKind,
    other?: IGenericType,
  ): Maybe<Operator<IGenericType>>;
  toTypeString(): string;
  toConcreteType(typeArguments: Map<TypeParameter, IType>): IType;
}

export interface IType extends IGenericType {
  typeArguments: Map<TypeParameter, IType>;
  getSuperType(): Maybe<IType>;
  isSubtype(type: IType): boolean;
  canCoerce(type: IType): boolean;
  getSuffix(name: string): Maybe<IType>;
  getOperator(kind: OperatorKind, other?: IType): Maybe<Operator<IType>>;
}

export interface Access {
  get: boolean;
  set: boolean;
}

export interface CallSignature {
  params: IType[];
  returns: IType;
}
