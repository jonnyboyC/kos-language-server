import { TokenType } from '../models/tokentypes';
import { Diagnostic } from 'vscode-languageserver';
import { Token } from '../models/token';

export type ITokenMap = Map<string, { type: TokenType; literal?: any }>;

export interface Tokenized {
  tokens: Token[];
  scanDiagnostics: Diagnostic[];
  directives: Directive[];
}

/**
 * The results kinda from the scanner
 */
export const enum ScanKind {
  /**
   * The scanner encountered whitespace
   */
  Whitespace,

  /**
   * The scanner encountered a token
   */
  Token,

  /**
   * The scanner produced a error diagnostics
   */
  Diagnostic,

  /**
   * The scanner found a directive
   */
  Directive,
}

export type Result<T, S extends ScanKind> = {
  result: T;
  kind: S;
};

/**
 * A token result
 */
export type TokenResult = Result<Token, ScanKind.Token>;

/**
 * A whitespace result
 */
export type WhitespaceResult = Result<null, ScanKind.Whitespace>;

/**
 * A diagnostics result
 */
export type DiagnosticResult = Result<Diagnostic, ScanKind.Diagnostic>;

/**
 * A directive result
 */
export type DirectiveResult<T extends Token = Token> = {
  directive: T;
  tokens: Token[];
  diagnostics: Diagnostic[];
  kind: ScanKind.Directive;
};

export interface Directive<T extends Token = Token> {
  directive: T;
  tokens: Token[];
}

export type ScanResult =
  | TokenResult
  | WhitespaceResult
  | DiagnosticResult
  | DirectiveResult;
