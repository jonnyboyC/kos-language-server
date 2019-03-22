import * as Inst from '../parser/inst';
import * as SuffixTerm from '../parser/suffixTerm';
import * as Expr from '../parser/expr';
import { relative, join, sep, dirname } from 'path';
import { RunInstType } from '../parser/types';
import { empty } from './typeGuards';
import { TokenType } from '../entities/tokentypes';
import { ILoadData } from '../types';
import { Location } from 'vscode-languageserver';

/**
 * Class to resolve run instructions or calls to file paths
 */
export class PathResolver {
  constructor (
    public volume0Path?: string,
    public volume0Uri?: string) { }

  /**
   * Is the resolve ready to resolve paths
   */
  public get ready(): boolean {
    return !empty(this.volume0Path) && !empty(this.volume0Uri);
  }

  /**
   * Resolve uri to load data
   * @param caller location of caller
   * @param path provided path in run instruction or class
   */
  public resolveUri(caller: Location, path?: string): Maybe<ILoadData> {
    if (empty(path) || empty(this.volume0Path) || empty(this.volume0Uri)) {
      return undefined;
    }

    // get relative run path from file
    const relativePath = relative(this.volume0Uri, dirname(caller.uri)).replace('%20', ' ');

    // check if the scripts reads from volume 0 "disk"
    // TODO no idea what to do for ship volumes
    const [possibleVolumne, ...remaining] = path.split(sep);
    if (possibleVolumne.startsWith('0:')) {
      // if of style 0:first\remaining...
      if (possibleVolumne.length > 2) {
        const first = possibleVolumne.slice(2);

        return {
          caller: { start: caller.range.start, end: caller.range.end },
          path: join(this.volume0Path, first, ...remaining),
          uri: join(this.volume0Uri, first, ...remaining),
        };
      }

      // else of style 0:\remaining...
      return {
        caller: { start: caller.range.start, end: caller.range.end },
        path: join(this.volume0Path, ...remaining),
        uri: join(this.volume0Uri, ...remaining),
      };
    }

    // if no volumne do a relative lookup
    return {
      caller: { start: caller.range.start, end: caller.range.end },
      path: join(this.volume0Path, relativePath, possibleVolumne, ...remaining),
      uri: join(this.volume0Uri, relativePath, possibleVolumne, ...remaining),
    };
  }
}

/**
 * Get io path, currently only supports string literals
 * @param inst io instructions
 */
export const ioPath = (inst: Inst.Rename | Inst.Copy | Inst.Delete | Inst.Log): Maybe<string> => {
  const { target } = inst;
  if (target instanceof SuffixTerm.Literal) {
    return literalPath(target);
  }

  return undefined;
};

/**
 * based on run type determine how to get file path
 * @param inst run instruction
 */
export const runPath = (inst: RunInstType): Maybe<string> => {
  if (inst instanceof Inst.Run) {
    const { identifier } = inst;

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

  // for run path varients check for literal
  const { expr } = inst;
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
