import { IType } from './types/types';
import { Range, Diagnostic } from 'vscode-languageserver';
import * as SuffixTerm from '../parser/suffixTerm';
import { KsSymbolKind } from '../analysis/types';

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
export interface ITypeResolved<T extends IType = IType>
  extends ITypeResolvedSuffix<T> {
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
  errors: Diagnostic[];
}

/**
 * type result for a kerboscript suffix
 */
export interface ITypeResultSuffix<
  T extends IType,
  R extends ITypeResolvedSuffix = ITypeResolvedSuffix
> {
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
  errors: Diagnostic[];
}
