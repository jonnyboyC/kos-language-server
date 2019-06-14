import { Type } from './types/types';
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
export interface ITypeResultSuffix<T extends SuffixTypeBuilder = SuffixTypeBuilder> {
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
 * What operator kind is present
 */
export const enum OperatorKind {
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
  boolean,
}
