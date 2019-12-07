import { Token } from '../models/token';
import { TokenType } from '../models/tokentypes';
import { Directive } from '../scanner/types';
import { DiagnosticUri } from '../types';
import {
  createDiagnosticUri,
  DIAGNOSTICS,
} from '../utilities/diagnosticsUtils';
import { DiagnosticSeverity } from 'vscode-languageserver';

export class Include {
  /**
   * The import path this directive should load
   */
  public readonly path: Token;

  /**
   * Construct a new include directive
   * @param path import path
   */
  constructor(path: Token) {
    this.path = path;
  }

  /**
   * Attempt to parse a include directive
   * @param directive include directive
   */
  static parse(
    directive: Directive<TokenType.include>,
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
      case TokenType.identifier:
        return new Include(token);
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
