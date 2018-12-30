import { TokenType } from '../entities/tokentypes';
import { Position } from 'vscode-languageserver';
import { IToken } from '../entities/types';

export type ITokenMap = Map<string, { type: TokenType, literal?: any }>;

// export interface ITokenMap {
//   readonly [key: string]: {
//     type: TokenType,
//     literal?: any,
//   };
// }

export interface IScanResult {
  tokens: IToken[];
  scanErrors: IScannerError[];
}

export interface IScannerError {
  readonly tag: 'scannerError';
  readonly message: string;
  readonly start: Position;
  readonly end: Position;
}

export interface IWhiteSpace {
  readonly tag: 'whitespace';
}

export type ScanResult = IToken | IScannerError | IWhiteSpace;
