import { Position, Range, Location } from 'vscode-languageserver';
import { TokenType } from './tokentypes';
import { IKsSymbolTracker } from '../analysis/types';

export interface ITokenBase extends Range, Location {
  readonly tag: 'token';
  readonly type: TokenType;
  readonly lexeme: string;
  readonly literal: any;
  readonly start: Position;
  readonly end: Position;
  readonly uri: string;
  readonly typeString: string;
  readonly range: Range;
}

export interface IToken extends ITokenBase {
  tracker: Maybe<IKsSymbolTracker>;
  readonly lookup: string;
  toString: () => string;
}




