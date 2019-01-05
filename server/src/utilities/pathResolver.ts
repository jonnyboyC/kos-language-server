import { RunInst, RunPathInst, RunPathOnceInst } from '../parser/inst';
import { relative, join, sep, dirname } from 'path';
import { RunInstType } from '../parser/types';
import { LiteralExpr } from '../parser/expr';
import { empty } from './typeGuards';
import { TokenType } from '../entities/tokentypes';
import { ILoadData } from '../types';

// resolve uri from run statments
export const resolveUri = (
  volume0Path: string,
  volumne0Uri: string,
  uri: string,
  inst: RunInstType): Maybe<ILoadData> => {

  // get realtive an run path from file
  const relativePath = relative(volumne0Uri, dirname(uri)).replace('%20', ' ');
  const runPath = instPath(inst);

  if (empty(runPath)) {
    return undefined;
  }

  // check if the scripts reads from volume 0 "disk"
  // TODO no idea what to do for ship volumnes
  const [possibleVolumne, ...remaining] = runPath.split(sep);
  if (possibleVolumne === '0:') {
    return {
      inst,
      path: join(volume0Path, ...remaining),
      uri: join(volumne0Uri, ...remaining),
    };
  }

  // if no volumne do a relative lookup
  return {
    inst,
    path: join(volume0Path, relativePath, possibleVolumne, ...remaining),
    uri: join(volumne0Uri, relativePath, possibleVolumne, ...remaining),
  };
};

// based on run type determine how to get file path
const instPath = (inst: RunInstType): Maybe<string> => {
  if (inst instanceof RunInst) {
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
  if (inst instanceof RunPathInst) {
    if (inst.expression instanceof LiteralExpr) {
      return literalPath(inst.expression);
    }
  }

  if (inst instanceof RunPathOnceInst) {
    if (inst.expression instanceof LiteralExpr) {
      return literalPath(inst.expression);
    }
  }

  return undefined;
};

// determine which string to return for the filepath
const literalPath = (expr: LiteralExpr): Maybe<string> => {
  const { token } = expr;

  switch (token.type) {
    case TokenType.string:
      return token.literal;
    case TokenType.fileIdentifier:
      return token.lexeme;
  }

  return undefined;
};
