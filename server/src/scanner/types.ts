import { TokenType } from '../entities/tokentypes';
import { Diagnostic } from 'vscode-languageserver';
import { IToken } from '../entities/types';

export type ITokenMap = Map<string, { type: TokenType, literal?: any }>;

export interface IScanResult {
  tokens: IToken[];
  scanErrors: Diagnostic[];
}

export const enum ScanKind {
  Whitespace,
  Token,
  Diagnostic,
}
