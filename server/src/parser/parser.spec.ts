import ava from 'ava';
import { Scanner } from '../scanner/scanner';
import { Parser } from './parser';
import { ISyntaxError } from '../scanner/types';
import { IParseError, IExpr, ExprResult, IParseResult } from './types';
import { LiteralExpr, VariableExpr, CallExpr } from './expr';
import { TokenType } from '../entities/tokentypes';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { IToken } from '../entities/types';

// scan source file
const scan = (source: string) : [IToken[], ISyntaxError[]] => {
  const scanner = new Scanner(source);
  return scanner.scanTokens();
};

// parse source
const parseExpression = (source: string): [IParseResult<IExpr>, ISyntaxError[]] => {
  const [tokens, scannerErrors] = scan(source);
  const parser = new Parser(tokens);
  return [parser.parseExpression(), scannerErrors];
};

const testDir = join(__dirname, '../../../kerboscripts');

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

    const scanner = new Scanner(kosFile);
    const [tokens, scannerErrors] = scanner.scanTokens();

    t.true(scannerErrors.length === 0);
    const parser = new Parser(tokens);
    const [, parseErrors] = parser.parse();

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
    atomTest('5', TokenType.Integer, 5),
    atomTest('10e6', TokenType.Double, 10e6),
    atomTest('"Test string"', TokenType.String, 'test string'),
    atomTest('"true if until"', TokenType.String, 'true if until'),
    atomTest('true', TokenType.True, true),
    atomTest('false', TokenType.False, false),
  ];

  for (const expression of validExpressions) {
    const [{ value }] = parseExpression(expression.source);
    t.true(isLiteral(value));
    if (isLiteral(value)) {
      t.deepEqual(expression.type, value.token.type);
      t.deepEqual(expression.literal, value.token.literal);
    }
  }
});

// test basic literal
ava('basic invalid literal', (t) => {
  const validExpressions = [
    atomTest('-', TokenType.Integer, 5),
    atomTest('"Test string', TokenType.String, 'test string'),
    atomTest('until', TokenType.String, 'true if until'),
  ];

  for (const expression of validExpressions) {
    const [{ value }, scannerErrors] = parseExpression(expression.source);
    t.false(isLiteral(value));
    t.true(scannerErrors.length === 0);
  }
});

// test basic identifier
ava('basic valid identifier', (t) => {
  const validExpressions = [
    atomTest('α', TokenType.Identifier, undefined),
    atomTest('until123OtherStuff', TokenType.Identifier, undefined),
    atomTest('_variableName', TokenType.Identifier, undefined),
    atomTest('БНЯД.БНЯД', TokenType.FileIdentifier, undefined),
    atomTest('fileVariable.thing', TokenType.FileIdentifier, undefined),
  ];

  for (const expression of validExpressions) {
    const [{ value }, scannerErrors] = parseExpression(expression.source);
    t.true(isVariable(value));
    t.true(scannerErrors.length === 0);

    if (isVariable(value)) {
      t.deepEqual(expression.type, value.token.type);
      t.deepEqual(expression.literal, value.token.literal);
    }
  }
});

// test basic identifier
ava('basic invalid identifier', (t) => {
  const validExpressions = [
    atomTest('11α', TokenType.Identifier, undefined),
    atomTest('+until123OtherStuff', TokenType.Identifier, undefined),
    atomTest(',БНЯД', TokenType.FileIdentifier, undefined),
  ];

  for (const expression of validExpressions) {
    const [{ value }, scannerErrors] = parseExpression(expression.source);
    t.false(isVariable(value));
    t.true(scannerErrors.length === 0);
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
    const [{ value }, scannerErrors] = parseExpression(expression.source);
    t.true(isCall(value));
    t.true(scannerErrors.length === 0);

    if (isCall(value)) {
      if (isVariable(value.callee)) {
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
    atomTest('11α', TokenType.Identifier, undefined),
    atomTest('+until123OtherStuff', TokenType.Identifier, undefined),
    atomTest(',БНЯД', TokenType.FileIdentifier, undefined),
  ];

  for (const expression of validExpressions) {
    const [{ value }, scannerErrors] = parseExpression(expression.source);
    t.false(isVariable(value));
    t.true(scannerErrors.length === 0);
  }
});

const isCall = (literalTest: ExprResult | ISyntaxError[]): literalTest is CallExpr => {
  return isExpr(literalTest) && literalTest instanceof CallExpr;
};

const isLiteral = (literalTest: ExprResult): literalTest is LiteralExpr => {
  return isExpr(literalTest) && literalTest instanceof LiteralExpr;
};

const isVariable = (literalTest: ExprResult): literalTest is VariableExpr => {
  return isExpr(literalTest) && literalTest instanceof VariableExpr;
};

const isExpr = (result: IParseError | IExpr | ISyntaxError[]): result is IExpr => {
  return !(result instanceof Array) && result.tag === 'expr';
};
