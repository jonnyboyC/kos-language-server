import ava from 'ava';
import { Scanner } from '../scanner/scanner';
import { Parser } from './parser';
import { IScannerError, IScanResult } from '../scanner/types';
import { IExpr, INodeResult } from './types';
import { LiteralExpr, VariableExpr, CallExpr } from './expr';
import { TokenType } from '../entities/tokentypes';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

// scan source file
const scan = (source: string) : IScanResult => {
  const scanner = new Scanner();
  return scanner.scanTokens(source);
};

// parse source
const parseExpression = (source: string): [INodeResult<IExpr>, IScannerError[]] => {
  const { tokens, scanErrors } = scan(source);
  const parser = new Parser();
  return [parser.parseExpression(tokens), scanErrors];
};

const testDir = join(__dirname, '../../../server/kerboscripts/parser_valid/');

type callbackFunc = (fileName: string) => void;

const walkDir = (dir: string, callback: callbackFunc): void => {
  readdirSync(dir).forEach((f) => {
    const dirPath = join(dir, f);
    const isDirectory = statSync(dirPath).isDirectory();
    isDirectory ?
      walkDir(dirPath, callback) : callback(join(dir, f));
  });
};

ava('parse all', (t) => {
  walkDir(testDir, (filePath) => {
    const kosFile = readFileSync(filePath, 'utf8');

    const scanner = new Scanner();
    const { tokens, scanErrors } = scanner.scanTokens(kosFile, filePath);

    t.true(scanErrors.length === 0);
    const parser = new Parser();
    const { parseErrors } = parser.parse(tokens);

    t.true(parseErrors.length === 0);
  });
});

interface AtomTestInterface {
  source: string;
  type: TokenType;
  literal: any;
}

const atomTest = (source: string, type: TokenType, literal: any): AtomTestInterface => {
  return {
    source,
    type,
    literal,
  };
};

// test basic literal
ava('basic valid literal', (t) => {
  const validExpressions = [
    atomTest('5', TokenType.integer, 5),
    atomTest('10e6', TokenType.double, 10e6),
    atomTest('"Test string"', TokenType.string, 'Test string'),
    atomTest('"true if until"', TokenType.string, 'true if until'),
    atomTest('true', TokenType.true, true),
    atomTest('false', TokenType.false, false),
  ];

  for (const expression of validExpressions) {
    const [{ value, errors }, scanErrors] = parseExpression(expression.source);
    t.true(value instanceof LiteralExpr);
    t.true(errors.length === 0);
    t.true(scanErrors.length === 0);

    if (value instanceof LiteralExpr) {
      t.deepEqual(expression.type, value.token.type);
      t.deepEqual(expression.literal, value.token.literal);
    }
  }
});

// test basic literal
ava('basic invalid literal', (t) => {
  const validExpressions = [
    atomTest('-', TokenType.integer, 5),
    atomTest('"Test string', TokenType.string, 'test string'),
  ];

  for (const expression of validExpressions) {
    const [{ value, errors }, scanErrors] = parseExpression(expression.source);
    t.false(value instanceof LiteralExpr);
    t.true(errors.length > 0 || scanErrors.length > 0);
  }
});

// test basic identifier
ava('basic valid identifier', (t) => {
  const validExpressions = [
    atomTest('α', TokenType.identifier, undefined),
    atomTest('until123OtherStuff', TokenType.identifier, undefined),
    atomTest('_variableName', TokenType.identifier, undefined),
    atomTest('БНЯД.БНЯД', TokenType.fileIdentifier, undefined),
    atomTest('fileVariable.thing', TokenType.fileIdentifier, undefined),
  ];

  for (const expression of validExpressions) {
    const [{ value }, scannerErrors] = parseExpression(expression.source);
    t.true(value instanceof VariableExpr);
    t.true(scannerErrors.length === 0);

    if (value instanceof VariableExpr) {
      t.deepEqual(expression.type, value.token.type);
      t.deepEqual(expression.literal, value.token.literal);
    }
  }
});

// test basic identifier
ava('basic invalid identifier', (t) => {
  const validExpressions = [
    atomTest('11α', TokenType.identifier, undefined),
    atomTest('+until123OtherStuff', TokenType.identifier, undefined),
    atomTest(',БНЯД', TokenType.fileIdentifier, undefined),
  ];

  for (const expression of validExpressions) {
    const [{ value, errors }] = parseExpression(expression.source);
    t.false(value instanceof VariableExpr);
    t.true(errors.length >= 0);
  }
});

interface CallTestInterface {
  source: string;
  callee: string;
  args: Function[];
}

const callTest = (source: string, callee: string, args: Function[]): CallTestInterface => {
  return {
    source,
    callee,
    args,
  };
};

// test basic identifier
ava('valid call', (t) => {
  const validExpressions = [
    callTest('test(4, "car")', 'test', [LiteralExpr, LiteralExpr]),
    callTest('БНЯД(varName, 14.3)', 'бняд', [VariableExpr, LiteralExpr]),
    callTest('_variableName()', '_variablename', []),
  ];

  for (const expression of validExpressions) {
    const [{ value, errors }, scannerErrors] = parseExpression(expression.source);
    t.true(value instanceof CallExpr);
    t.true(errors.length === 0);
    t.true(scannerErrors.length === 0);

    if (value instanceof CallExpr) {
      t.true(value.callee instanceof VariableExpr);
      if (value.callee instanceof VariableExpr) {
        t.deepEqual(expression.callee, value.callee.token.lexeme);
        t.deepEqual(expression.args.length, value.args.length);

        // tslint:disable-next-line:no-increment-decrement
        for (let i = 0; i < expression.args.length; i++) {
          t.true(value.args[i] instanceof expression.args[i]);
        }
      }
    }
  }
});

// test basic identifier
ava('invalid call', (t) => {
  const validExpressions = [
    atomTest('11α', TokenType.identifier, undefined),
    atomTest('+until123OtherStuff', TokenType.identifier, undefined),
    atomTest(',БНЯД', TokenType.fileIdentifier, undefined),
  ];

  for (const expression of validExpressions) {
    const [{ value }, scannerErrors] = parseExpression(expression.source);
    t.false(value instanceof VariableExpr);
    t.true(scannerErrors.length === 0);
  }
});
