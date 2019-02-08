import ava from 'ava';
import { Scanner } from '../scanner/scanner';
import { Parser } from './parser';
import { IScannerError, IScanResult } from '../scanner/types';
import { IExpr, INodeResult } from './types';
import * as Expr from './expr';
import { TokenType } from '../entities/tokentypes';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { empty } from '../utilities/typeGuards';

// scan source file
const scan = (source: string) : IScanResult => {
  const scanner = new Scanner(source);
  return scanner.scanTokens();
};

// parse source
const parseExpression = (source: string): [INodeResult<IExpr>, IScannerError[]] => {
  const { tokens, scanErrors } = scan(source);
  const parser = new Parser(tokens);
  return [parser.parseExpression(), scanErrors];
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

    const scanner = new Scanner(kosFile, filePath);
    const { tokens, scanErrors } = scanner.scanTokens();

    t.true(scanErrors.length === 0);
    const parser = new Parser(tokens);
    const { parseErrors } = parser.parse();

    t.true(parseErrors.length === 0);
  });
});

interface IAtomTest {
  source: string;
  type: TokenType;
  literal: any;
}

const atomTest = (source: string, type: TokenType, literal: any): IAtomTest => {
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
    atomTest('fileVariable.thing', TokenType.fileIdentifier, 'filevariable.thing'),
  ];

  for (const expression of validExpressions) {
    const [{ value, errors }, scanErrors] = parseExpression(expression.source);
    t.true(value instanceof Expr.Literal);
    t.true(errors.length === 0);
    t.true(scanErrors.length === 0);

    if (value instanceof Expr.Literal) {
      t.is(expression.type, value.token.type);
      t.is(expression.literal, value.token.literal);
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
    t.false(value instanceof Expr.Literal);
    t.true(errors.length > 0 || scanErrors.length > 0);
  }
});

// test basic identifier
ava('basic valid identifier', (t) => {
  const validExpressions = [
    atomTest('α', TokenType.identifier, undefined),
    atomTest('until123OtherStuff', TokenType.identifier, undefined),
    atomTest('_variableName', TokenType.identifier, undefined),
  ];

  for (const expression of validExpressions) {
    const [{ value }, scannerErrors] = parseExpression(expression.source);
    t.true(value instanceof Expr.Variable);
    t.true(scannerErrors.length === 0);

    if (value instanceof Expr.Variable) {
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
    atomTest('БНЯД.БНЯД', TokenType.fileIdentifier, undefined),
  ];

  for (const expression of validExpressions) {
    const [{ value, errors }] = parseExpression(expression.source);
    t.false(value instanceof Expr.Variable);
    t.true(errors.length >= 0);
  }
});

interface ICallTest {
  source: string;
  callee: string;
  args: Function[];
}

const callTest = (source: string, callee: string, args: Constructor<Expr.Expr>[])
  : ICallTest => ({ source, callee, args });

// test basic identifier
ava('valid call', (t) => {
  const validExpressions = [
    callTest('test(4, "car")', 'test', [Expr.Literal, Expr.Literal]),
    callTest('БНЯД(varName, 14.3)', 'бняд', [Expr.Variable, Expr.Literal]),
    callTest('_variableName()', '_variablename', []),
  ];

  for (const expression of validExpressions) {
    const [{ value, errors }, scannerErrors] = parseExpression(expression.source);
    t.true(value instanceof Expr.Call);
    t.true(errors.length === 0);
    t.true(scannerErrors.length === 0);

    if (value instanceof Expr.Call) {
      t.true(value.callee instanceof Expr.Variable);
      if (value.callee instanceof Expr.Variable) {
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
    t.false(value instanceof Expr.Variable);
    t.true(scannerErrors.length === 0);
  }
});

interface IBinaryTest {
  source: string;
  operator: TokenType;
  leftArm: IBinaryArm;
  rightArm: IBinaryArm;
}

interface IBinaryArm {
  expr: Constructor<Expr.Expr>;
  literal: any;
}

const binaryTest = (
  source: string,
  operator: TokenType,
  left: Constructor<Expr.Expr>,
  leftLiteral: any,
  right: Constructor<Expr.Expr>,
  rightLiteral: any): IBinaryTest => {
  return {
    source,
    operator,
    leftArm: {
      expr: left,
      literal: leftLiteral,
    },
    rightArm: {
      expr: right,
      literal: rightLiteral,
    },
  };
};

// test basic binary
ava('valid binary', (t) => {
  const validExpressions = [
    binaryTest('10 + 5', TokenType.plus, Expr.Literal, 10, Expr.Literal, 5),
    binaryTest(
      '"example" + "other"',
      TokenType.plus,
      Expr.Literal,
      'example',
      Expr.Literal,
      'other'),
    binaryTest(
      'variable <> false',
      TokenType.notEqual,
      Expr.Variable,
      undefined,
      Expr.Literal,
      false),
    binaryTest(
      'suffix:call(10, 5) <= 10 ^ 3',
      TokenType.lessEqual,
      Expr.Suffix,
      undefined,
      Expr.Factor,
      undefined),
  ];

  for (const expression of validExpressions) {
    const [{ value, errors }, scannerErrors] = parseExpression(expression.source);
    t.true(value instanceof Expr.Binary);
    t.true(errors.length === 0);
    t.true(scannerErrors.length === 0);

    if (value instanceof Expr.Binary) {
      t.is(value.operator.type, expression.operator, 'wrong binary operator');
      t.true(value.left instanceof expression.leftArm.expr, 'wrong left node');
      t.true(value.right instanceof expression.rightArm.expr, 'wrong right node');

      if (!empty(expression.leftArm.literal) && value.left instanceof Expr.Literal) {
        t.is(value.left.token.literal, expression.leftArm.literal);
      }

      if (!empty(expression.rightArm.literal) && value.right instanceof Expr.Literal) {
        t.is(value.right.token.literal, expression.rightArm.literal);
      }
    }
  }
});
