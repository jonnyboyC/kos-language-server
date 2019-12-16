import { Token } from '../models/token';
import { TokenType } from '../models/tokentypes';
import { DiagnosticUri } from '../types';
import {
  createDiagnosticUri,
  DIAGNOSTICS,
} from '../utilities/diagnosticsUtils';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { DirectiveTokens } from './types';

type IncludeTypes =
  | TokenType.string
  | TokenType.identifier
  | TokenType.fileIdentifier;

export class Include {
  /**
   * The underlying directive
   */
  public readonly directive: Token<TokenType.include>;

  /**
   * The import path this directive should load
   */
  public readonly path: Token<IncludeTypes>;

  /**
   * Construct a new include directive
   * @param path import path
   */
  constructor(directive: Token<TokenType.include>, path: Token<IncludeTypes>) {
    this.directive = directive;
    this.path = path;
  }

  /**
   * What path should be imported from this inclTude
   */
  public includePath(): string {
    switch (this.path.type) {
      case TokenType.string:
        return this.path.literal;
      default:
        return this.path.lexeme;
    }
  }

  /**
   * Attempt to parse a include directive
   * @param directive include directive
   */
  static parse(
    directive: DirectiveTokens<TokenType.include>,
  ): Include | DiagnosticUri {
    if (directive.tokens.length === 0) {
      return createDiagnosticUri(
        directive.directive,
        'Must include string or bare path in #include directive',
        DiagnosticSeverity.Information,
        DIAGNOSTICS.DIRECTIVE_INVALID_INCLUDE,
      );
    }

    const [token] = directive.tokens;
    switch (token.type) {
      case TokenType.string:
      case TokenType.fileIdentifier:
      case TokenType.identifier:
        return new Include(directive.directive, token as any);
      default:
        return createDiagnosticUri(
          token,
          'Must include string or bare path in #include directive',
          DiagnosticSeverity.Information,
          DIAGNOSTICS.DIRECTIVE_INVALID_INCLUDE,
        );
    }
  }
}
