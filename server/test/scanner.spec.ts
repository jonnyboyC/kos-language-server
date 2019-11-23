import { readFileSync } from 'fs';
import { join, basename } from 'path';
import { walkDir } from '../src/utilities/fsUtils';
import { TokenType } from '../src/models/tokentypes';
import { zip } from '../src/utilities/arrayUtils';
import { Scanner } from '../src/scanner/scanner';
import { Token } from '../src/models/token';

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

const scan = (source: string): Token[] => {
  const scanner = new Scanner(source);
  return scanner.scanTokens().tokens;
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
    const tokens = scan('10');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].lexeme).toBe('10');
    expect(tokens[0].literal).toBe(10);
  });

  describe('when scanning doubles with leading numbers', () => {
    const tokens = scan('10.0');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].lexeme).toBe('10.0');
    expect(tokens[0].literal).toBe(10.0);
  });

  describe('when scanning doubles with no leading number', () => {
    const tokens = scan('.0');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].lexeme).toBe('.0');
    expect(tokens[0].literal).toBe(0.0);
  });
});
