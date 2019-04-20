import ava, { ExecutionContext } from 'ava';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { Diagnostic } from 'vscode-languageserver';
import { IScanResult } from '../scanner/types';
import { Scanner } from '../scanner/scanner';
import { INodeResult, IExpr, Atom, SuffixTermTrailer } from '../parser/types';
import { Parser } from '../parser/parser';
import { TokenCheck } from '../parser/tokenCheck';
import { zip } from '../utilities/arrayUtilities';
import { TokenType } from '../entities/tokentypes';
import * as Expr from '../parser/expr';
import { empty } from '../utilities/typeGuards';
import * as SuffixTerm from '../parser/suffixTerm';

// scan source file
const scan = (source: string) : IScanResult => {
  const scanner = new Scanner(source);
  return scanner.scanTokens();
};

// parse source
const parseExpression = (source: string): [INodeResult<IExpr>, Diagnostic[]] => {
  const { tokens, scanErrors } = scan(source);
  const parser = new Parser('', tokens);
  return [parser.parseExpression(), scanErrors];
};

const testDir = join(__dirname, '../../../kerboscripts/parser_valid/');

type callbackFunc = (fileName: string) => void;
const tokenCheck = new TokenCheck();

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
    const parser = new Parser('', tokens);
    const { parseErrors } = parser.parse();

    t.true(parseErrors.length === 0);
  });
});

ava('parse all validate', (t) => {
  walkDir(testDir, (filePath) => {
    const kosFile = readFileSync(filePath, 'utf8');

    const scanner1 = new Scanner(kosFile, filePath);
    const scanResults1 = scanner1.scanTokens();

    t.true(scanResults1.scanErrors.length === 0);
    const parser1 = new Parser('', scanResults1.tokens);
    const parseResults1 = parser1.parse();
    t.true(parseResults1.parseErrors.length === 0);

    const prettyKosFile = parseResults1.script.toString();
    const scanner2 = new Scanner(prettyKosFile, filePath);
    const scanResults2 = scanner2.scanTokens();

    t.true(scanResults1.scanErrors.length === 0);
    const parser2 = new Parser('', scanResults2.tokens);
    const parseResults2 = parser2.parse();

    t.true(parseResults2.parseErrors.length === 0);

    const zipped = zip(
      tokenCheck.orderedTokens(parseResults1.script),
      tokenCheck.orderedTokens(parseResults2.script),
    );
    for (const [token1, token2] of zipped) {
      t.is(token1.lexeme, token2.lexeme);
      t.is(token1.type, token2.type);
    }
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

const testAtom = (
  t: ExecutionContext<{}>,
  value: IExpr,
  testFunct: (atom: Atom) => void) => {

  t.true(value instanceof Expr.Suffix);
  if (value instanceof Expr.Suffix) {
    t.true(empty(value.trailer));
    t.true(value.suffixTerm instanceof SuffixTerm.SuffixTerm);
    if (value.suffixTerm instanceof SuffixTerm.SuffixTerm) {
      t.is(0, value.suffixTerm.trailers.length);
      testFunct(value.suffixTerm.atom);
    }
  }
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
    t.is(errors.length, 0);
    t.is(scanErrors.length, 0);

    testAtom(t, value, (atom) => {
      t.true(atom instanceof SuffixTerm.Literal);
      if (atom instanceof SuffixTerm.Literal) {
        t.is(atom.token.type, expression.type);
        t.is(atom.token.literal, expression.literal);
      }
    });
  }
});

// test basic literal
ava('basic invalid literal', (t) => {
  const validExpressions = [
    atomTest('-', TokenType.integer, 5),
    atomTest('"Test string', TokenType.string, 'test string'),
  ];

  for (const expression of validExpressions) {
    const [{ errors }, scanErrors] = parseExpression(expression.source);
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
    const [{ value, errors }, scanErrors] = parseExpression(expression.source);
    t.is(errors.length, 0);
    t.is(scanErrors.length, 0);

    testAtom(t, value, (atom) => {
      t.true(atom instanceof SuffixTerm.Identifier);
      if (atom instanceof SuffixTerm.Identifier) {
        t.is(expression.type, atom.token.type);
        t.is(expression.literal, atom.token.literal);
      }
    });
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

const testSuffixTerm = (
  t: ExecutionContext<{}>,
  value: IExpr,
  atomTest: (atom: Atom) => void,
  ...trailerTests: ((trailer: SuffixTermTrailer) => void)[]) => {

  t.true(value instanceof Expr.Suffix);
  if (value instanceof Expr.Suffix) {
    t.true(empty(value.trailer));
    t.true(value.suffixTerm instanceof SuffixTerm.SuffixTerm);
    if (value.suffixTerm instanceof SuffixTerm.SuffixTerm) {
      t.is(trailerTests.length, value.suffixTerm.trailers.length);
      atomTest(value.suffixTerm.atom);

      for (const [trailerTest, trailer] of zip(trailerTests, value.suffixTerm.trailers)) {
        trailerTest(trailer);
      }
    }
  }
};

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
    t.is(errors.length, 0);
    t.is(scannerErrors.length, 0);

    testSuffixTerm(
      t, value,
      (atom) => {
        t.true(atom instanceof SuffixTerm.Identifier);
        if (atom instanceof SuffixTerm.Identifier) {
          t.is(expression.callee, atom.token.lexeme);
        }
      },
      (trailer) => {
        t.true(trailer instanceof SuffixTerm.Call);
        if (trailer instanceof SuffixTerm.Call) {
          t.is(expression.args.length, trailer.args.length);

          for (let i = 0; i < expression.args.length; i += 1) {
            testAtom(t, trailer.args[i], (atom) => {
              t.true(atom instanceof expression.args[i]);
            });
          }
        }
      },
    );
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

      if (expression.leftArm.expr.prototype instanceof SuffixTerm.SuffixTermBase) {
        testSuffixTerm(
          t, value.left,
          (atom) => {
            t.true(atom instanceof expression.leftArm.expr);
            if (atom instanceof SuffixTerm.Literal) {
              t.is(expression.leftArm.literal, atom.token.literal);
            }
          },
        );
      } else {
        t.true(value.left instanceof expression.leftArm.expr);
      }

      if (expression.rightArm.expr.prototype instanceof SuffixTerm.SuffixTermBase) {
        testSuffixTerm(
          t, value.right,
          (atom) => {
            t.true(atom instanceof expression.rightArm.expr);
            if (atom instanceof SuffixTerm.Literal) {
              t.is(expression.rightArm.literal, atom.token.literal);
            }
          },
        );
      } else {
        t.true(value.right instanceof expression.rightArm.expr);
      }
    }
  }
});
