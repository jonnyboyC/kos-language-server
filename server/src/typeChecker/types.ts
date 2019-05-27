import { Type } from './types/types';
import { Diagnostic } from 'vscode-languageserver';
import { KsSymbolKind } from '../analysis/types';
import { TypeNode } from './typeNode';
import { SuffixTypeBuilder } from './suffixTypeNode';

/**
 * Cumulative suffix type information indicating the type of each
 * segment of the suffix
 */
export interface ITypeResolvedSuffix<T extends Type = Type> {
  /**
   * Atom of the given suffix term
   */
  atom: TypeNode<T>;

  /**
   * Suffix term trailers attached to the atom
   */
  termTrailers: TypeNode[];

  /**
   * Optional suffix term trailer potentially following this suffix term
   */
  suffixTrailer?: ITypeResolvedSuffix;
}

/**
 * Cumulative suffix type information indicating the type of each
 * segment of the suffix for the root of the suffix
 */
export interface ITypeResolved<T extends Type = Type>
  extends ITypeResolvedSuffix<T> {
  /**
   * Indicates the entity type of the root atom
   */
  atomType: KsSymbolKind;
}

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
