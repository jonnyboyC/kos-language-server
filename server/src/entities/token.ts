import { TokenType } from './tokentypes';
import { Range, Position } from 'vscode-languageserver';
import { TokenBase } from './types';
import { SymbolTracker } from '../analysis/types';

/**
 * Represents  an atomic unit of the kerboscript language
 */
export class Token implements TokenBase {
  public readonly type: TokenType;
  public readonly lexeme: string;
  public readonly literal: any;
  public readonly start: Position;
  public readonly end: Position;
  public readonly uri: string;

  /**
   * What symbol tracker is this token tied too
   */
  public tracker: Maybe<SymbolTracker>;

  constructor(
    type: TokenType,
    lexeme: string,
    literal: any,
    start: Position,
    end: Position,
    uri: string) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.start = start;
    this.end = end;
    this.uri = uri;
    this.tracker = undefined;
  }

  /**
   * A lowercase version of the lexeme for case insenstive comparisions
   */
  public get lookup(): string {
    return this.lexeme.toLowerCase();
  }

  public get tag(): 'token' {
    return 'token';
  }

  public get typeString(): string {
    return TokenType[this.type];
  }

  public get range(): Range {
    return {
      start: this.start,
      end: this.end,
    };
  }

  /**
   * Convert the token to a human readable string
   */
  public toString(): string {
    if (this.literal) {
      return `${this.typeString} ${this.lexeme} ${this.literal}`;
    }
    return `${this.typeString} ${this.lexeme}`;
  }
}
