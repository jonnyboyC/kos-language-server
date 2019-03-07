import { Position, Range, Location } from 'vscode-languageserver';
import { TokenType } from './tokentypes';

export interface IToken extends Range, Location {
  readonly tag: 'token';
  readonly type: TokenType;
  readonly lexeme: string;
  readonly literal: any;
  readonly start: Position;
  readonly end: Position;
  readonly uri: string;
  readonly typeString: string;
  readonly range: Range;
  toString: () => string;
}
