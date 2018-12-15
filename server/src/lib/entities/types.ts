import { Position } from "vscode-languageserver";
import { TokenType } from "./tokentypes";

export interface IToken {
  readonly tag: 'token',
  readonly type: TokenType,
  readonly lexeme: string,
  readonly literal: any;
  readonly start: Position;
  readonly end: Position;
  toString: () => string;
}