import { RunStmtType } from '../parser/types';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import * as Stmt from '../parser/stmt';
import * as Expr from '../parser/expr';
import * as SuffixTerm from '../parser/suffixTerm';
import { TokenType } from '../entities/tokentypes';
import { URI } from 'vscode-uri';
import { extname } from 'path';

/**
 * based on run type determine how to get file path
 * @param stmt run statement
 */
export const runPath = (stmt: RunStmtType): string | Diagnostic => {
  if (stmt instanceof Stmt.Run) {
    const { identifier } = stmt;

    switch (identifier.type) {
      case TokenType.string:
        return identifier.literal;
      case TokenType.fileIdentifier:
      case TokenType.identifier:
        return identifier.lexeme;
      default:
        return cannotLoad(stmt);
    }
  }

  // for run path variants check for literal
  const { path: expr } = stmt;
  if (expr instanceof Expr.Suffix) {
    if (expr.suffixTerm.atom instanceof SuffixTerm.Literal) {
      return literalPath(expr.suffixTerm.atom) || cannotLoad(stmt);
    }
  }

  return cannotLoad(stmt);
};

/**
 * determine which string to return for the filepath from literal
 * @param expr literal expression
 */
const literalPath = (expr: SuffixTerm.Literal): string | undefined => {
  const { token } = expr;

  switch (token.type) {
    case TokenType.string:
      return token.literal;
    case TokenType.fileIdentifier:
      return token.lexeme;
  }

  return undefined;
};

/**
 * Normalize a filepath to the the default extension .ks if rules allow it to
 * @param uri absolute resolved path
 */
export const normalizeExtensions = (uri: URI | string): Maybe<string> => {
  const ext = URI.isUri(uri) ? extname(uri.fsPath) : extname(uri);
  const uriString = uri.toString();

  switch (ext) {
    case '.ks':
      return uriString;
    case '.ksm':
      return uriString.replace('.ksm', '.ks');
    case '':
      return `${uriString}.ks`;
    default:
      return undefined;
  }
};

/**
 * Provide a diagnostic when a path cannot be loaded
 * @param stmt the run statement
 */
const cannotLoad = (stmt: RunStmtType) =>
  Diagnostic.create(
    stmt,
    'kos-language-server cannot load runtime resolved run statements',
    DiagnosticSeverity.Hint,
  );
