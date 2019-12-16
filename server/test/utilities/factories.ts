import { Token } from '../../src/models/token';
import { TokenType } from '../../src/models/tokentypes';

export const createToken = <T extends TokenType>(
  type: T,
  lexeme: string,
  literal?: any,
): Token => {
  return new Token(
    type,
    lexeme,
    literal,
    {
      line: 0,
      character: 0,
    },
    {
      line: 0,
      character: 1,
    },
    'file:///fake.ks',
  );
};
