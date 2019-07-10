import { Type, ArgumentType } from './types/types';
import { Diagnostic } from 'vscode-languageserver';
import { SuffixTypeBuilder } from './suffixTypeNode';

/**
 * type result for a kerboscript expression
 */
export interface ITypeResultExpr<T extends Type> {
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
   * resolved cummulative suffix types
   */
  builder: T;

  /**
   * errors encounted during this suffix type check
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
  returnType: ArgumentType;

  /**
   * What is the other type of the operator
   */
  other: ArgumentType;
}

/**
 * Construct a unary operation for a given type
 */
export interface UnaryConstructor {
  /**
   * What is the operator
   */
  operator: OperatorKind.negate | OperatorKind.defined | OperatorKind.not;

  /**
   * What is the return type of this operator
   */
  returnType: ArgumentType;

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
