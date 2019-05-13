import { Position, Range, Location } from 'vscode-languageserver';
import { TokenType } from './tokentypes';
import { IKsSymbolTracker } from '../analysis/types';

/**
 * Represents the core of an atomic unit of the kerboscript language
 */
export interface ITokenBase extends Range, Location {

  /**
   * descriminated union tag
   */
  readonly tag: 'token';

  /**
   * Token type, i.e. what character of the kerboscript alphabet is represented
   */
  readonly type: TokenType;

  /**
   * What is the actual text represented by this token
   */
  readonly lexeme: string;

  /**
   * For tokens that present literal value what is the value if any
   */
  readonly literal: any;

  /**
   * What is the starting position of this token
   */
  readonly start: Position;

  /**
   * What is the ending position of this token
   */
  readonly end: Position;

  /**
   * What uri does this token belong to.
   */
  readonly uri: string;

  /**
   * A human readable string for the token type
   */
  readonly typeString: string;

  /**
   * What range is this token defined for
   */
  readonly range: Range;
}

/**
 * Represents  an atomic unit of the kerboscript language
 */
export interface IToken extends ITokenBase {
  /**
   * What symbol tracker is this token tied too
   */
  tracker: Maybe<IKsSymbolTracker>;

  /**
   * A lowercase version of the lexeme for case insenstive comparisions
   */
  readonly lookup: string;

  /**
   * Convert the token to a human readable string
   */
  toString: () => string;
}
