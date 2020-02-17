import { Position, Range, Location } from 'vscode-languageserver';
import { TokenType } from './tokentypes';

/**
 * Represents the core of an atomic unit of the kerboscript language
 */
export interface TokenBase<T extends TokenType = TokenType>
  extends Range,
    Location {
  /**
   * descriminated union tag
   */
  readonly tag: 'token';

  /**
   * Token type, i.e. what character of the kerboscript alphabet is represented
   */
  readonly type: T;

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
