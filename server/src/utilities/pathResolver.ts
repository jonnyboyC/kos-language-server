import { RunInst, RunPathInst, RunPathOnceInst } from '../parser/inst';
import { relative, join, sep, dirname } from 'path';
import { RunInstType } from '../parser/types';
import { LiteralExpr } from '../parser/expr';
import { empty } from './typeGuards';
import { TokenType } from '../entities/tokentypes';

export const resolveUri = (
  volume0Path: string,
  volumne0Uri: string,
  uri: string,
  inst: RunInstType): Maybe<{uri: string, path: string}> => {
  const relativePath = relative(volumne0Uri, dirname(uri));
  const runPath = instPath(inst);

  if (empty(runPath)) {
    return undefined;
  }

  const [possibleVolumne, ...remaining] = runPath.split(sep);
  if (possibleVolumne === '0:') {
    return {
      path: join(volume0Path, ...remaining),
      uri: join(volumne0Uri, ...remaining),
    };
  }

  return {
    path: join(volume0Path, relativePath, possibleVolumne, ...remaining),
    uri: join(volumne0Uri, relativePath, possibleVolumne, ...remaining),
  };
};

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

const instPath = (inst: RunInstType): Maybe<string> => {
  if (inst instanceof RunInst) {
    return inst.identifier.lexeme;
  }

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
