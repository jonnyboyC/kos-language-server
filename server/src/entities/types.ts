import { Position, Range } from 'vscode-languageserver';
import { TokenType } from './tokentypes';

export interface IToken extends Range {
  readonly tag: 'token';
  readonly type: TokenType;
  readonly lexeme: string;
  readonly literal: any;
  readonly start: Position;
  readonly end: Position;
  readonly uri?: string;
  toString: () => string;
}
