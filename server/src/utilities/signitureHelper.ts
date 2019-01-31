import { IToken } from '../entities/types';
import { Position } from 'vscode-languageserver';
import { TokenType } from '../entities/tokentypes';
import { empty } from './typeGuards';
import { binarySearchIndex } from './positionHelpers';
import { Parser } from '../parser/parser';

export const signitureHelper = (tokens: IToken[], pos: Position): Maybe<IdentifierIndex> => {
  const result = partialArgs(tokens, pos);
  if (empty(result)) {
    return result;
  }

  const [identifier, argsToken] = result;
  const index = argPosition(argsToken);

  return {
    index,
    identifier: identifier.lexeme,
  };
};

const partialArgs = (tokens: IToken[], pos: Position): Maybe<[IToken, IToken[]]> => {
  let depth = 0;
  let identifier: Maybe<IToken> = undefined;
  const posIdx = binarySearchIndex(tokens, pos);

  if (Array.isArray(posIdx)) {
    return undefined;
  }

  let i = posIdx;
  // tslint:disable-next-line:no-increment-decrement
  for (; i >= 0; i--) {
    const token = tokens[i];

    if (depth < 0) {
      if (token.type === TokenType.identifier) {
        identifier = token;
      }

      break;
    }

    switch (token.type) {
      case TokenType.bracketClose:
        depth += 1;
        break;
      case TokenType.bracketOpen:
        depth -= 1;
        break;
    }
  }

  if (empty(identifier)) {
    return undefined;
  }

  const argsToken = tokens.slice(i + 2, posIdx + 1);
  return [identifier, argsToken];
};

const argPosition = (partialArgs: IToken[]): number => {
  const parser = new Parser(partialArgs);
  const args = parser.parseArgCount();
  return args.value;
};
