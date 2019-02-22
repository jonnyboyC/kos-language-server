import * as Inst from '../parser/inst';
import { relative, join, sep, dirname } from 'path';
import { RunInstType } from '../parser/types';
import { empty } from './typeGuards';
import { TokenType } from '../entities/tokentypes';
import { ILoadData } from '../types';
import * as SuffixTerm from '../parser/suffixTerm';
import { Location } from 'vscode-languageserver';

// resolve uri from run statments
export const resolveUri = (
  volume0Path: string,
  volumn0Uri: string,
  caller: Location,
  path?: string): Maybe<ILoadData> => {

  if (empty(path)) {
    return undefined;
  }

  // get realtive an run path from file
  const relativePath = relative(volumn0Uri, dirname(caller.uri)).replace('%20', ' ');

  // check if the scripts reads from volume 0 "disk"
  // TODO no idea what to do for ship volumnes
  const [possibleVolumne, ...remaining] = path.split(sep);
  if (possibleVolumne === '0:') {
    return {
      caller: { start: caller.range.start, end: caller.range.end },
      path: join(volume0Path, ...remaining),
      uri: join(volumn0Uri, ...remaining),
    };
  }

  // if no volumne do a relative lookup
  return {
    caller: { start: caller.range.start, end: caller.range.end },
    path: join(volume0Path, relativePath, possibleVolumne, ...remaining),
    uri: join(volumn0Uri, relativePath, possibleVolumne, ...remaining),
  };
};

export const ioPath = (inst: Inst.Rename | Inst.Copy | Inst.Delete): Maybe<string> => {
  const { target } = inst;
  if (target instanceof SuffixTerm.Literal) {
    return literalPath(target);
  }

  return undefined;
};

// based on run type determine how to get file path
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
  if (expr instanceof SuffixTerm.Literal) {
    return literalPath(expr);
  }

  return undefined;
};

// determine which string to return for the filepath
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
