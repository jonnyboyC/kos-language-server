import { readFileSync } from 'fs';
import { join, basename } from 'path';
import { walkDir } from '../src/utilities/fsUtils';
import { TokenType } from '../src/models/tokentypes';
import { zip } from '../src/utilities/arrayUtils';
import { Scanner } from '../src/scanner/scanner';
import { Tokenized } from '../src/scanner/types';
import { getRandomInt } from '../src/utilities/randomUtils';

const testDir = join(__dirname, '../../kerboscripts/parser_valid/');

describe('Scan all files', () => {
  test('scan all', () => {
    walkDir(testDir, filePath => {
      if (!basename(filePath).endsWith('.ks')) {
        return;
      }

      const kosFile = readFileSync(filePath, 'utf8');

      const scanner = new Scanner(kosFile);
      const { tokens, scanDiagnostics: scanErrors } = scanner.scanTokens();
      const errorResult = scanErrors.map(error => ({ filePath, ...error }));

      expect(tokens.length > 0).toBe(true);
      expect(errorResult.length === 0).toBe(true);
    });
  });
});

const scannerPath = join(
  __dirname,
  '../../kerboscripts/parser_valid/unitTests/scannertest.ks',
);

const sequence = [
  TokenType.atSign,
  TokenType.lazyGlobal,
  TokenType.on,
  TokenType.period,
  TokenType.global,
  TokenType.function,
  TokenType.identifier,
  TokenType.curlyOpen,
  TokenType.parameter,
  TokenType.identifier,
  TokenType.comma,
  TokenType.identifier,
  TokenType.is,
  TokenType.integer,
  TokenType.period,
  TokenType.print,
  TokenType.bracketOpen,
  TokenType.identifier,
  TokenType.bracketClose,
  TokenType.period,
  TokenType.for,
  TokenType.identifier,
  TokenType.in,
  TokenType.identifier,
  TokenType.curlyOpen,
  TokenType.print,
  TokenType.bracketOpen,
  TokenType.identifier,
  TokenType.bracketClose,
  TokenType.period,
  TokenType.curlyClose,
  TokenType.from,
  TokenType.curlyOpen,
  TokenType.local,
  TokenType.identifier,
  TokenType.is,
  TokenType.integer,
  TokenType.period,
  TokenType.curlyClose,
  TokenType.until,
  TokenType.identifier,
  TokenType.greater,
  TokenType.integer,
  TokenType.step,
  TokenType.curlyOpen,
  TokenType.set,
  TokenType.identifier,
  TokenType.to,
  TokenType.identifier,
  TokenType.plus,
  TokenType.double,
  TokenType.period,
  TokenType.curlyClose,
  TokenType.do,
  TokenType.curlyOpen,
  TokenType.wait,
  TokenType.until,
  TokenType.identifier,
  TokenType.period,
  TokenType.curlyClose,
  TokenType.curlyClose,
  TokenType.lock,
  TokenType.identifier,
  TokenType.to,
  TokenType.string,
  TokenType.period,
  TokenType.on,
  TokenType.identifier,
  TokenType.curlyOpen,
  TokenType.stage,
  TokenType.period,
  TokenType.clearscreen,
  TokenType.period,
  TokenType.log,
  TokenType.identifier,
  TokenType.colon,
  TokenType.identifier,
  TokenType.to,
  TokenType.string,
  TokenType.period,
  TokenType.curlyClose,
  TokenType.unlock,
  TokenType.identifier,
  TokenType.period,
  TokenType.identifier,
  TokenType.bracketOpen,
  TokenType.list,
  TokenType.bracketOpen,
  TokenType.bracketClose,
  TokenType.comma,
  TokenType.integer,
  TokenType.bracketClose,
  TokenType.period,
  TokenType.print,
  TokenType.bracketOpen,
  TokenType.choose,
  TokenType.string,
  TokenType.if,
  TokenType.true,
  TokenType.else,
  TokenType.string,
  TokenType.bracketClose,
  TokenType.period,
  TokenType.identifier,
  TokenType.off,
  TokenType.period,
  TokenType.runPath,
  TokenType.bracketOpen,
  TokenType.string,
  TokenType.bracketClose,
  TokenType.period,
  TokenType.reboot,
  TokenType.period,
];

const scan = (source: string): Tokenized => {
  const scanner = new Scanner(source);
  return scanner.scanTokens();
};

describe('Scan test file', () => {
  test('token sequence', () => {
    const kosFile = readFileSync(scannerPath, 'utf8');

    const scanner = new Scanner(kosFile);
    const { tokens, scanDiagnostics: scanErrors } = scanner.scanTokens();
    expect(scanErrors.length === 0).toBe(true);

    for (const [type, token] of zip(sequence, tokens)) {
      expect(token.type).toBe(type);
    }
  });
});

describe('When scanning numbers', () => {
  describe('when scanning integers', () => {
    const { tokens, scanDiagnostics } = scan('10');

    expect(scanDiagnostics).toHaveLength(0);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].lexeme).toBe('10');
    expect(tokens[0].literal).toBe(10);
  });

  describe('when scanning doubles with leading numbers', () => {
    const { tokens, scanDiagnostics } = scan('10.0');

    expect(scanDiagnostics).toHaveLength(0);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].lexeme).toBe('10.0');
    expect(tokens[0].literal).toBe(10.0);
  });

  describe('when scanning doubles with no leading number', () => {
    const { tokens, scanDiagnostics } = scan('.0');

    expect(scanDiagnostics).toHaveLength(0);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].lexeme).toBe('.0');
    expect(tokens[0].literal).toBe(0.0);
  });
});

const directiveMap = new Map([
  [TokenType.region, 'region'],
  [TokenType.endRegion, 'endregion'],
  [TokenType.include, 'include'],
]);

describe('when scanning directives', () => {
  describe('when only the directive appears', () => {
    test('it tokenizes the directive', () => {
      for (const [tokenType, lexeme] of directiveMap) {
        const whitespace = ' '.repeat(Math.floor(Math.random() * 5));
        const { directives, scanDiagnostics, tokens } = scan(
          `//${whitespace}#${lexeme}`,
        );

        expect(tokens).toHaveLength(0);
        expect(scanDiagnostics).toHaveLength(0);
        expect(directives).toHaveLength(1);

        const { directive, tokens: directiveTokens } = directives[0];
        expect(directive.type).toBe(tokenType);
        expect(directive.lexeme).toBe(`//${whitespace}#${lexeme}`);
        expect(directiveTokens).toHaveLength(0);
      }
    });
  });

  const stringBodies = [
    'cat',
    '#',
    '234oij',
    ';',
    'while',
    '^12309wefoij',
    'if',
    'true',
  ];

  const identifier = [
    'president',
    'x1234',
    'kos',
    'xxxxxxzy',
    'for',
    'on',
    'giraffe',
  ];

  const numbers = ['14.3', '10e6', '123.4', '.432', '34.6e2.8'];

  describe('when extra tokens are present', () => {
    test('when one or more strings are present', () => {
      for (const [tokenType, lexeme] of directiveMap) {
        const directiveWhitespace = ' '.repeat(getRandomInt(5));

        const tokenCount = Math.floor(Math.random() * 3) + 1;
        const tokenWhitespace = Array(tokenCount)
          .fill(0)
          .map(_ => ' '.repeat(getRandomInt(2) + 1));
        const lexemes = Array(tokenCount)
          .fill(0)
          .map(_ => stringBodies[getRandomInt(stringBodies.length - 1)]);

        let final = `//${directiveWhitespace}#${lexeme}`;
        for (const [whitespace, token] of zip(tokenWhitespace, lexemes)) {
          final += `${whitespace}"${token}"`;
        }
        const { directives, scanDiagnostics, tokens } = scan(final);

        expect(tokens).toHaveLength(0);
        expect(scanDiagnostics).toHaveLength(0);
        expect(directives).toHaveLength(1);

        const { directive, tokens: directiveTokens } = directives[0];
        expect(directive.type).toBe(tokenType);
        expect(directive.lexeme).toBe(`//${directiveWhitespace}#${lexeme}`);
        expect(directiveTokens).toHaveLength(tokenCount);

        for (const [foundToken, expectedLexeme] of zip(
          directiveTokens,
          lexemes,
        )) {
          expect(foundToken.type).toBe(TokenType.string);
          expect(foundToken.lexeme).toBe(`"${expectedLexeme}"`);
        }
      }
    });

    test('when one or more identifiers are present', () => {
      for (const [tokenType, lexeme] of directiveMap) {
        const directiveWhitespace = ' '.repeat(getRandomInt(5));

        const tokenCount = Math.floor(Math.random() * 3) + 1;
        const tokenWhitespace = Array(tokenCount)
          .fill(0)
          .map(_ => ' '.repeat(getRandomInt(2) + 1));
        const lexemes = Array(tokenCount)
          .fill(0)
          .map(_ => identifier[getRandomInt(identifier.length - 1)]);

        let final = `//${directiveWhitespace}#${lexeme}`;
        for (const [whitespace, token] of zip(tokenWhitespace, lexemes)) {
          final += `${whitespace}${token}`;
        }
        const { directives, scanDiagnostics, tokens } = scan(final);

        expect(tokens).toHaveLength(0);
        expect(scanDiagnostics).toHaveLength(0);
        expect(directives).toHaveLength(1);

        const { directive, tokens: directiveTokens } = directives[0];
        expect(directive.type).toBe(tokenType);
        expect(directive.lexeme).toBe(`//${directiveWhitespace}#${lexeme}`);
        expect(directiveTokens).toHaveLength(tokenCount);

        for (const [foundToken, expectedLexeme] of zip(
          directiveTokens,
          lexemes,
        )) {
          expect(foundToken.type).toBe(TokenType.identifier);
          expect(foundToken.lexeme).toBe(`${expectedLexeme}`);
        }
      }
    });

    test('when one or more numbers are present', () => {
      for (const [tokenType, lexeme] of directiveMap) {
        const directiveWhitespace = ' '.repeat(getRandomInt(5));

        const tokenCount = Math.floor(Math.random() * 3) + 1;
        const tokenWhitespace = Array(tokenCount)
          .fill(0)
          .map(_ => ' '.repeat(getRandomInt(2) + 1));

        const lexemes = Array(tokenCount)
          .fill(0)
          .map(_ => numbers[getRandomInt(numbers.length - 1)]);

        let final = `//${directiveWhitespace}#${lexeme}`;
        for (const [whitespace, token] of zip(tokenWhitespace, lexemes)) {
          final += `${whitespace}${token}`;
        }

        const { directives, scanDiagnostics, tokens } = scan(final);

        expect(tokens).toHaveLength(0);
        expect(scanDiagnostics).toHaveLength(0);
        expect(directives).toHaveLength(1);

        const { directive, tokens: directiveTokens } = directives[0];
        expect(directive.type).toBe(tokenType);
        expect(directive.lexeme).toBe(`//${directiveWhitespace}#${lexeme}`);
        expect(directiveTokens).toHaveLength(tokenCount);

        for (const [foundToken, expectedLexeme] of zip(
          directiveTokens,
          lexemes,
        )) {
          expect(foundToken.type).toBe(TokenType.double);
          expect(foundToken.lexeme).toBe(`${expectedLexeme}`);
        }
      }
    });
  });
});
