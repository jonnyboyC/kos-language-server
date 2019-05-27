import { Position } from 'vscode-languageserver';
import { TokenType } from '../entities/tokentypes';
import { empty } from './typeGuards';
import { binarySearchIndex } from './positionUtils';
import { Parser } from '../parser/parser';
import { Token } from '../entities/token';

export const signitureHelper = (tokens: Token[], pos: Position): Maybe<IdentifierIndex> => {
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

const partialArgs = (tokens: Token[], pos: Position): Maybe<[Token, Token[]]> => {
  let depth = 0;
  let identifier: Maybe<Token> = undefined;
  const posIdx = binarySearchIndex(tokens, pos);

  if (Array.isArray(posIdx)) {
    return undefined;
  }

  let i = posIdx;
  for (; i >= 0; i -= 1) {
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

const argPosition = (partialArgs: Token[]): number => {
  const parser = new Parser('', partialArgs);
  const args = parser.parseArgCount();
  return args.value;
};
