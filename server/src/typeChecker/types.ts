import { IType } from './types/types';
import { Range } from 'vscode-languageserver';
import * as SuffixTerm from '../parser/suffixTerm';
import { KsSymbolKind } from '../analysis/types';

/**
 * Error interface for the typechecker
 */
export interface ITypeError extends Range {
  /**
   * Discriminated union tag
   */
  tag: 'typeError';

  /**
   * Range the error occured on
   */
  range: Range;

  /**
   * Other information related to the error
   */
  otherInfo: string[];

  /**
   * Error message
   */
  message: string;
}

/**
 * Storage type for suffixterm type resolution
 */
export interface ITypeNode<T extends IType = IType> extends Range {
  /**
   * Type at a given suffix node
   */
  type: T;

  /**
   * Suffix node type is attached to
   */
  node: SuffixTerm.SuffixTermBase;
}

/**
 * Cumulative suffix type information indicating the type of each
 * segment of the suffix
 */
export interface ITypeResolvedSuffix<T extends IType = IType> {
  /**
   * Atom of the given suffix term
   */
  atom: ITypeNode<T>;

  /**
   * Suffix term trailers attached to the atom
   */
  termTrailers: ITypeNode[];

  /**
   * Optional suffix term trailer potentially following this suffix term
   */
  suffixTrailer?: ITypeResolvedSuffix;
}

/**
 * Cumulative suffix type information indicating the type of each
 * segment of the suffix for the root of the suffix
 */
export interface ITypeResolved<T extends IType = IType> extends ITypeResolvedSuffix<T>  {
  /**
   * Indicates the entity type of the root atom
   */
  atomType: KsSymbolKind;
}

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
  errors: ITypeError[];
}

/**
 * type result for a kerboscript suffix
 */
export interface ITypeResultSuffix<
  T extends IType,
  R extends ITypeResolvedSuffix = ITypeResolvedSuffix> {

  /**
   * result type
   */
  type: T;

  /**
   * resolved cummulative suffix types
   */
  resolved: R;

  /**
   * errors encounted during this suffix type check
   */
  errors: ITypeError[];
}
