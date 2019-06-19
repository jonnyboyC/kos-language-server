import * as Stmt from '../parser/stmt';
import * as SuffixTerm from '../parser/suffixTerm';
import * as Expr from '../parser/expr';
import { relative, join, dirname } from 'path';
import { RunStmtType } from '../parser/types';
import { empty } from './typeGuards';
import { TokenType } from '../entities/tokentypes';
import { ILoadData } from '../types';
import { Location } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

/**
 * Class to resolve run statements or calls to file paths
 */
export class PathResolver {
  /**
   * The path corresponding to root of volume 0 of the kos directory
   */
  public volume0Path?: string;

  constructor(volume0Path?: string) {
    this.volume0Path = volume0Path;
  }

  /**
   * Is the resolve ready to resolve paths
   */
  public get ready(): boolean {
    return !empty(this.volume0Path);
  }

  /**
   * Resolve uri to load data
   * @param caller location of caller
   * @param runPath path provided in a run statement
   */
  public resolveUri(caller: Location, runPath?: string): Maybe<ILoadData> {
    if (empty(runPath) || empty(this.volume0Path)) {
      return undefined;
    }

    // get relative run path from file
    const uri = URI.parse(caller.uri);

    // currently only support file scheme
    if (uri.scheme !== 'file') {
      return undefined;
    }

    const relativePath = relative(this.volume0Path, dirname(uri.fsPath));

    // check if the scripts reads from volume 0 "disk"
    // TODO no idea what to do for ship volumes
    const [possibleVolume, ...remaining] = runPath.split('/');
    if (possibleVolume.startsWith('0:')) {
      // if of style 0:first\remaining...
      if (possibleVolume.length > 2) {
        const first = possibleVolume.slice(2);

        return this.loadData(caller, first, ...remaining);
      }

      // else of style 0:\remaining...
      return this.loadData(caller, ...remaining);
    }

    // if no volume do a relative lookup
    return this.loadData(caller, relativePath, possibleVolume, ...remaining);
  }

  /**
   * Creates a load data payload from a caller and path segments
   * @param caller call location
   * @param pathSegments path segments
   */
  private loadData(
    caller: Location,
    ...pathSegments: string[]
  ): Maybe<ILoadData> {
    if (empty(this.volume0Path)) return undefined;

    return {
      caller: { start: caller.range.start, end: caller.range.end },
      path: join(this.volume0Path, ...pathSegments),
      uri: URI.file(join(this.volume0Path, ...pathSegments)),
    };
  }
}

/**
 * based on run type determine how to get file path
 * @param stmt run statement
 */
export const runPath = (stmt: RunStmtType): Maybe<string> => {
  if (stmt instanceof Stmt.Run) {
    const { identifier } = stmt;

    switch (identifier.type) {
      case TokenType.string:
        return identifier.literal;
      case TokenType.fileIdentifier:
      case TokenType.identifier:
        return identifier.lexeme;
      default:
        return undefined;
    }
  }

  // for run path variants check for literal
  const { expr } = stmt;
  if (expr instanceof Expr.Suffix) {
    if (expr.suffixTerm.atom instanceof SuffixTerm.Literal) {
      return literalPath(expr.suffixTerm.atom);
    }
  }

  return undefined;
};

/**
 * determine which string to return for the filepath from literal
 * @param expr literal expression
 */
const literalPath = (expr: SuffixTerm.Literal): Maybe<string> => {
  const { token } = expr;

  switch (token.type) {
    case TokenType.string:
      return token.literal;
    case TokenType.fileIdentifier:
      return token.lexeme;
  }

  return undefined;
};
