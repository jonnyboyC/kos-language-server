import { TokenType } from '../entities/tokentypes';
import { Diagnostic } from 'vscode-languageserver';
import { Token } from '../entities/token';

export type ITokenMap = Map<string, { type: TokenType; literal?: any }>;

export interface IScanResult {
  tokens: Token[];
  scanErrors: Diagnostic[];
}

export const enum ScanKind {
  Whitespace,
  Token,
  Diagnostic,
  Region,
}
