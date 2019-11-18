import { TokenType } from '../models/tokentypes';
import { Diagnostic } from 'vscode-languageserver';
import { Token } from '../models/token';

export type ITokenMap = Map<string, { type: TokenType; literal?: any, ref?: Token }>;

export interface Tokenized {
  tokens: Token[];
  scanDiagnostics: Diagnostic[];
  regions: Token[];
  types: Token[];
}

export const enum ScanKind {
  Whitespace,
  Token,
  Diagnostic,
  Region,
  Type,
}

export type Result<T, S extends ScanKind> = {
  result: T;
  kind: S;
};

export type TokenResult = Result<Token, ScanKind.Token>;
export type WhitespaceResult = Result<null, ScanKind.Whitespace>;
export type DiagnosticResult = Result<Diagnostic, ScanKind.Diagnostic>;
export type RegionResult = Result<Token, ScanKind.Region>;
export type TypeResult = Result<Token, ScanKind.Type>;

export type ScanResult =
  | TokenResult
  | WhitespaceResult
  | DiagnosticResult
  | RegionResult
  | TypeResult;
