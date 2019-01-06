import { TokenType } from '../entities/tokentypes';
import { Range } from 'vscode-languageserver';
import { IToken } from '../entities/types';

export type ITokenMap = Map<string, { type: TokenType, literal?: any }>;

export interface IScanResult {
  tokens: IToken[];
  scanErrors: IScannerError[];
}

export interface IScannerError extends Range {
  readonly tag: 'scannerError';
  readonly message: string;
}

export interface IWhiteSpace {
  readonly tag: 'whitespace';
}

export type ScanResult = IToken | IScannerError | IWhiteSpace;
