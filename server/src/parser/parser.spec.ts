import ava from 'ava';
import { Scanner } from '../scanner/scanner';
import { Parser } from './parser';
import { IScannerError, IScanResult } from '../scanner/types';
import { IExpr, INodeResult } from './types';
import * as Expr from './expr';
import * as SuffixTerm from './suffixTerm';
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
    t.true(value instanceof SuffixTerm.Literal);
    t.true(errors.length === 0);
    t.true(scanErrors.length === 0);

    if (value instanceof SuffixTerm.Literal) {
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
    t.false(value instanceof SuffixTerm.Literal);
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
    t.true(value instanceof SuffixTerm.Identifier);
    t.true(scannerErrors.length === 0);

    if (value instanceof SuffixTerm.Identifier) {
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
    t.false(value instanceof SuffixTerm.Identifier);
    t.true(errors.length >= 0);
  }
});

interface ICallTest {
  source: string;
  callee: string;
  args: Function[];
}

const callTest = (source: string, callee: string, args: Constructor<SuffixTerm.SuffixTermBase>[])
  : ICallTest => ({ source, callee, args });

// test basic identifier
ava('valid call', (t) => {
  const validExpressions = [
    callTest('test(4, "car")', 'test', [SuffixTerm.Literal, SuffixTerm.Literal]),
    callTest('БНЯД(varName, 14.3)', 'бняд', [SuffixTerm.Identifier, SuffixTerm.Literal]),
    callTest('_variableName()', '_variablename', []),
  ];

  for (const expression of validExpressions) {
    const [{ value, errors }, scannerErrors] = parseExpression(expression.source);
    t.true(value instanceof SuffixTerm.SuffixTerm);
    t.true(errors.length === 0);
    t.true(scannerErrors.length === 0);

    if (value instanceof SuffixTerm.SuffixTerm) {
      t.true(value.atom instanceof SuffixTerm.Identifier);
      if (value.atom instanceof SuffixTerm.Identifier) {
        t.deepEqual(value.trailers.length, 1);

        const call = value.trailers[0];
        t.true(call instanceof SuffixTerm.Call);

        if (call instanceof SuffixTerm.Call) {
          t.deepEqual(expression.callee, value.atom.token.lexeme);
          t.deepEqual(expression.args.length, call.args.length);

          for (let i = 0; i < expression.args.length; i += 1) {
            t.true(call.args[i] instanceof expression.args[i]);
          }
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
    t.false(value instanceof SuffixTerm.Identifier);
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
  expr: Constructor<SuffixTerm.SuffixTermBase | Expr.Expr>;
  literal: any;
}

const binaryTest = (
  source: string,
  operator: TokenType,
  left: Constructor<SuffixTerm.SuffixTermBase | Expr.Expr>,
  leftLiteral: any,
  right: Constructor<SuffixTerm.SuffixTermBase | Expr.Expr>,
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
    binaryTest('10 + 5', TokenType.plus, SuffixTerm.Literal, 10, SuffixTerm.Literal, 5),
    binaryTest(
      '"example" + "other"',
      TokenType.plus,
      SuffixTerm.Literal,
      'example',
      SuffixTerm.Literal,
      'other'),
    binaryTest(
      'variable <> false',
      TokenType.notEqual,
      SuffixTerm.Identifier,
      undefined,
      SuffixTerm.Literal,
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

      if (!empty(expression.leftArm.literal) && value.left instanceof SuffixTerm.Literal) {
        t.is(value.left.token.literal, expression.leftArm.literal);
      }

      if (!empty(expression.rightArm.literal) && value.right instanceof SuffixTerm.Literal) {
        t.is(value.right.token.literal, expression.rightArm.literal);
      }
    }
  }
});
