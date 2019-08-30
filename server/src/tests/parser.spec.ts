import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { Diagnostic } from 'vscode-languageserver';
import { Tokenized } from '../scanner/types';
import { Scanner } from '../scanner/scanner';
import {
  INodeResult,
  IExpr,
  Atom,
  SuffixTermTrailer,
  ScopeKind,
  ParseResult,
} from '../parser/types';
import { Parser } from '../parser/parser';
import { TokenCheck } from '../parser/tokenCheck';
import { zip } from '../utilities/arrayUtils';
import { TokenType } from '../entities/tokentypes';
import * as Expr from '../parser/expr';
import * as Decl from '../parser/declare';
import { empty } from '../utilities/typeGuards';
import * as SuffixTerm from '../parser/suffixTerm';

// scan source file
const scan = (source: string): Tokenized => {
  const scanner = new Scanner(source);
  return scanner.scanTokens();
};

// parse source expression
const parseExpression = (
  source: string,
): [INodeResult<IExpr>, Diagnostic[]] => {
  const { tokens, scanErrors } = scan(source);
  const parser = new Parser('', tokens);
  return [parser.parseExpression(), scanErrors];
};

// parse source expression
const parse = (source: string): ParseResult => {
  const { tokens, scanErrors } = scan(source);
  expect(scanErrors.length).toBe(0);

  const parser = new Parser('', tokens);
  return parser.parse();
};

const testDir = join(__dirname, '../../../kerboscripts/parser_valid/');

type callbackFunc = (fileName: string) => void;
const tokenCheck = new TokenCheck();

const walkDir = (dir: string, callback: callbackFunc): void => {
  readdirSync(dir).forEach(f => {
    const dirPath = join(dir, f);
    const isDirectory = statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(join(dir, f));
  });
};

describe('Parse all test files', () => {
  test('parse all', () => {
    walkDir(testDir, filePath => {
      const kosFile = readFileSync(filePath, 'utf8');

      const scanner = new Scanner(kosFile, filePath);
      const { tokens, scanErrors } = scanner.scanTokens();

      expect(scanErrors.length === 0).toBe(true);
      const parser = new Parser('', tokens);
      const { parseErrors } = parser.parse();

      expect(parseErrors.length === 0).toBe(true);
    });
  });

  test('parse all validate', () => {
    walkDir(testDir, filePath => {
      const kosFile = readFileSync(filePath, 'utf8');

      const scanner1 = new Scanner(kosFile, filePath);
      const scanResults1 = scanner1.scanTokens();

      expect(scanResults1.scanErrors.length).toBe(0);
      const parser1 = new Parser('', scanResults1.tokens);
      const parseResults1 = parser1.parse();
      expect(parseResults1.parseErrors.length).toBe(0);

      const prettyKosFile = parseResults1.script.toString();
      const scanner2 = new Scanner(prettyKosFile, filePath);
      const scanResults2 = scanner2.scanTokens();

      expect(scanResults1.scanErrors.length).toBe(0);
      const parser2 = new Parser('', scanResults2.tokens);
      const parseResults2 = parser2.parse();

      expect(parseResults2.parseErrors.length).toBe(0);

      const zipped = zip(
        tokenCheck.orderedTokens(parseResults1.script),
        tokenCheck.orderedTokens(parseResults2.script),
      );
      for (const [token1, token2] of zipped) {
        expect(token1.lexeme).toBe(token2.lexeme);
        expect(token1.type).toBe(token2.type);
      }
    });
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

const testAtom = (value: IExpr, testFunct: (atom: Atom) => void) => {
  expect(value instanceof Expr.Suffix).toBe(true);
  if (value instanceof Expr.Suffix) {
    expect(empty(value.trailer)).toBe(true);
    expect(value.suffixTerm instanceof SuffixTerm.SuffixTerm).toBe(true);
    if (value.suffixTerm instanceof SuffixTerm.SuffixTerm) {
      expect(0).toBe(value.suffixTerm.trailers.length);
      testFunct(value.suffixTerm.atom);
    }
  }
};

interface ICallTest {
  source: string;
  callee: string;
  args: Function[];
}

const testSuffixTerm = (
  value: IExpr,
  atomTest: (atom: Atom) => void,
  ...trailerTests: ((trailer: SuffixTermTrailer) => void)[]
) => {
  expect(value instanceof Expr.Suffix).toBe(true);
  if (value instanceof Expr.Suffix) {
    expect(empty(value.trailer)).toBe(true);
    expect(value.suffixTerm instanceof SuffixTerm.SuffixTerm).toBe(true);
    if (value.suffixTerm instanceof SuffixTerm.SuffixTerm) {
      expect(trailerTests.length).toBe(value.suffixTerm.trailers.length);
      atomTest(value.suffixTerm.atom);

      for (const [trailerTest, trailer] of zip(
        trailerTests,
        value.suffixTerm.trailers,
      )) {
        trailerTest(trailer);
      }
    }
  }
};

const callTest = (
  source: string,
  callee: string,
  args: Constructor<SuffixTerm.SuffixTermBase>[],
): ICallTest => ({ source, callee, args });

interface ExpressionComponent {
  expr: Constructor<SuffixTerm.SuffixTermBase | Expr.Expr>;
  literal: any;
}

interface IUnaryTest {
  source: string;
  operator: TokenType;
  base: ExpressionComponent;
}

const unaryTest = (
  source: string,
  operator: TokenType,
  base: Constructor<SuffixTerm.SuffixTermBase | Expr.Expr>,
  baseLiteral: any,
): IUnaryTest => {
  return {
    source,
    operator,
    base: {
      expr: base,
      literal: baseLiteral,
    },
  };
};

interface IBinaryTest {
  source: string;
  operator: TokenType;
  leftArm: ExpressionComponent;
  rightArm: ExpressionComponent;
}

const binaryTest = (
  source: string,
  operator: TokenType,
  left: Constructor<SuffixTerm.SuffixTermBase | Expr.Expr>,
  leftLiteral: any,
  right: Constructor<SuffixTerm.SuffixTermBase | Expr.Expr>,
  rightLiteral: any,
): IBinaryTest => {
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

interface ITernaryTest {
  source: string;
  trueArm: ExpressionComponent;
  condition: ExpressionComponent;
  falseArm: ExpressionComponent;
}

const ternaryTest = (
  source: string,
  trueArm: Constructor<SuffixTerm.SuffixTermBase | Expr.Expr>,
  trueLiteral: any,
  condition: Constructor<SuffixTerm.SuffixTermBase | Expr.Expr>,
  conditionLiteral: any,
  falseArm: Constructor<SuffixTerm.SuffixTermBase | Expr.Expr>,
  falseLiteral: any,
): ITernaryTest => {
  return {
    source,
    trueArm: {
      expr: trueArm,
      literal: trueLiteral,
    },
    condition: {
      expr: condition,
      literal: conditionLiteral,
    },
    falseArm: {
      expr: falseArm,
      literal: falseLiteral,
    },
  };
};

describe('Parse expressions', () => {
  // test basic literal
  test('basic valid literal', () => {
    const validExpressions = [
      atomTest('5', TokenType.integer, 5),
      atomTest('10e6', TokenType.double, 10e6),
      atomTest('"Test string"', TokenType.string, 'Test string'),
      atomTest('"true if until"', TokenType.string, 'true if until'),
      atomTest('true', TokenType.true, true),
      atomTest('false', TokenType.false, false),
      atomTest(
        'fileVariable.thing',
        TokenType.fileIdentifier,
        'filevariable.thing',
      ),
    ];

    for (const expression of validExpressions) {
      const [{ value, errors }, scanErrors] = parseExpression(
        expression.source,
      );
      expect(errors.length).toBe(0);
      expect(scanErrors.length).toBe(0);

      testAtom(value, atom => {
        expect(atom instanceof SuffixTerm.Literal).toBe(true);
        if (atom instanceof SuffixTerm.Literal) {
          expect(atom.token.type).toBe(expression.type);
          expect(atom.token.literal).toBe(expression.literal);
        }
      });
    }
  });

  // test basic literal
  test('basic invalid literal', () => {
    const validExpressions = [
      atomTest('-', TokenType.integer, 5),
      atomTest('"Test string', TokenType.string, 'test string'),
    ];

    for (const expression of validExpressions) {
      const [{ errors }, scanErrors] = parseExpression(expression.source);
      expect(errors.length > 0 || scanErrors.length > 0).toBe(true);
    }
  });

  // test basic identifier
  test('basic valid identifier', () => {
    const validExpressions = [
      atomTest('α', TokenType.identifier, undefined),
      atomTest('until123OtherStuff', TokenType.identifier, undefined),
      atomTest('_variableName', TokenType.identifier, undefined),
    ];

    for (const expression of validExpressions) {
      const [{ value, errors }, scanErrors] = parseExpression(
        expression.source,
      );
      expect(errors.length).toBe(0);
      expect(scanErrors.length).toBe(0);

      testAtom(value, atom => {
        expect(atom instanceof SuffixTerm.Identifier).toBe(true);
        if (atom instanceof SuffixTerm.Identifier) {
          expect(expression.type).toBe(atom.token.type);
          expect(expression.literal).toBe(atom.token.literal);
        }
      });
    }
  });

  // test basic identifier
  test('basic invalid identifier', () => {
    const validExpressions = [
      atomTest('11α', TokenType.identifier, undefined),
      atomTest('+until123OtherStuff', TokenType.identifier, undefined),
      atomTest(',БНЯД', TokenType.fileIdentifier, undefined),
      atomTest('БНЯД.БНЯД', TokenType.fileIdentifier, undefined),
    ];

    for (const expression of validExpressions) {
      const [{ value, errors }] = parseExpression(expression.source);
      expect(value instanceof SuffixTerm.Identifier).toBe(false);
      expect(errors.length >= 0).toBe(true);
    }
  });

  // test basic identifier
  test('valid call', () => {
    const validExpressions = [
      callTest('test(4, "car")', 'test', [
        SuffixTerm.Literal,
        SuffixTerm.Literal,
      ]),
      callTest('БНЯД(varName, 14.3)', 'бняд', [
        SuffixTerm.Identifier,
        SuffixTerm.Literal,
      ]),
      callTest('_variableName()', '_variablename', []),
    ];

    for (const expression of validExpressions) {
      const [{ value, errors }, scannerErrors] = parseExpression(
        expression.source,
      );
      expect(errors.length).toBe(0);
      expect(scannerErrors.length).toBe(0);

      testSuffixTerm(
        value,
        atom => {
          expect(atom instanceof SuffixTerm.Identifier).toBe(true);
          if (atom instanceof SuffixTerm.Identifier) {
            expect(expression.callee).toBe(atom.token.lookup);
          }
        },
        trailer => {
          expect(trailer instanceof SuffixTerm.Call).toBe(true);
          if (trailer instanceof SuffixTerm.Call) {
            expect(expression.args.length).toBe(trailer.args.length);

            for (let i = 0; i < expression.args.length; i += 1) {
              testAtom(trailer.args[i], atom => {
                expect(atom instanceof expression.args[i]).toBe(true);
              });
            }
          }
        },
      );
    }
  });

  // test basic identifier
  test('invalid call', () => {
    const validExpressions = [
      atomTest('11α', TokenType.identifier, undefined),
      atomTest('+until123OtherStuff', TokenType.identifier, undefined),
      atomTest(',БНЯД', TokenType.fileIdentifier, undefined),
    ];

    for (const expression of validExpressions) {
      const [{ value }, scannerErrors] = parseExpression(expression.source);
      expect(value instanceof SuffixTerm.Identifier).toBe(false);
      expect(scannerErrors.length === 0).toBe(true);
    }
  });

  test('valid unary', () => {
    const validExpressions = [
      unaryTest('+ 5', TokenType.plus, SuffixTerm.Literal, 5),
      unaryTest(
        'defined other',
        TokenType.defined,
        SuffixTerm.Identifier,
        undefined,
      ),
      unaryTest('not false', TokenType.not, SuffixTerm.Literal, false),
      unaryTest('-suffix:call(10, 5)', TokenType.minus, Expr.Suffix, undefined),
    ];

    for (const expression of validExpressions) {
      const [{ value, errors }, scannerErrors] = parseExpression(
        expression.source,
      );
      expect(value instanceof Expr.Unary).toBe(true);
      expect(errors.length === 0).toBe(true);
      expect(scannerErrors.length === 0).toBe(true);

      if (value instanceof Expr.Unary) {
        expect(value.operator.type).toBe(expression.operator);

        if (
          expression.base.expr.prototype instanceof SuffixTerm.SuffixTermBase
        ) {
          testSuffixTerm(value.factor, atom => {
            expect(atom instanceof expression.base.expr).toBe(true);
            if (atom instanceof SuffixTerm.Literal) {
              expect(expression.base.literal).toBe(atom.token.literal);
            }
          });
        } else {
          expect(value.factor instanceof expression.base.expr).toBe(true);
        }
      }
    }
  });

  // test basic binary
  test('valid binary', () => {
    const validExpressions = [
      binaryTest(
        '10 + 5',
        TokenType.plus,
        SuffixTerm.Literal,
        10,
        SuffixTerm.Literal,
        5,
      ),
      binaryTest(
        '"example" + "other"',
        TokenType.plus,
        SuffixTerm.Literal,
        'example',
        SuffixTerm.Literal,
        'other',
      ),
      binaryTest(
        'variable <> false',
        TokenType.notEqual,
        SuffixTerm.Identifier,
        undefined,
        SuffixTerm.Literal,
        false,
      ),
      binaryTest(
        'suffix:call(10, 5) <= 10 ^ 3',
        TokenType.lessEqual,
        Expr.Suffix,
        undefined,
        Expr.Factor,
        undefined,
      ),
    ];

    for (const expression of validExpressions) {
      const [{ value, errors }, scannerErrors] = parseExpression(
        expression.source,
      );
      expect(value instanceof Expr.Binary).toBe(true);
      expect(errors.length === 0).toBe(true);
      expect(scannerErrors.length === 0).toBe(true);

      if (value instanceof Expr.Binary) {
        expect(value.operator.type).toBe(expression.operator);

        if (
          expression.leftArm.expr.prototype instanceof SuffixTerm.SuffixTermBase
        ) {
          testSuffixTerm(value.left, atom => {
            expect(atom instanceof expression.leftArm.expr).toBe(true);
            if (atom instanceof SuffixTerm.Literal) {
              expect(expression.leftArm.literal).toBe(atom.token.literal);
            }
          });
        } else {
          expect(value.left instanceof expression.leftArm.expr).toBe(true);
        }

        if (
          expression.rightArm.expr.prototype instanceof
          SuffixTerm.SuffixTermBase
        ) {
          testSuffixTerm(value.right, atom => {
            expect(atom instanceof expression.rightArm.expr).toBe(true);
            if (atom instanceof SuffixTerm.Literal) {
              expect(expression.rightArm.literal).toBe(atom.token.literal);
            }
          });
        } else {
          expect(value.right instanceof expression.rightArm.expr).toBe(true);
        }
      }
    }
  });

  test('valid ternary', () => {
    const validExpressions = [
      ternaryTest(
        'choose 10 if x < 10 else 20',
        SuffixTerm.Literal,
        10,
        Expr.Binary,
        undefined,
        SuffixTerm.Literal,
        20,
      ),

      ternaryTest(
        'choose body:name if true else defined x',
        Expr.Suffix,
        undefined,
        SuffixTerm.Literal,
        true,
        Expr.Unary,
        undefined,
      ),
    ];

    for (const expression of validExpressions) {
      const [{ value, errors }, scannerErrors] = parseExpression(
        expression.source,
      );
      expect(value instanceof Expr.Ternary).toBe(true);
      expect(errors.length === 0).toBe(true);
      expect(scannerErrors.length === 0).toBe(true);

      if (value instanceof Expr.Ternary) {
        if (
          expression.trueArm.expr.prototype instanceof SuffixTerm.SuffixTermBase
        ) {
          testSuffixTerm(value.trueExpr, atom => {
            expect(atom instanceof expression.trueArm.expr).toBe(true);
            if (atom instanceof SuffixTerm.Literal) {
              expect(expression.trueArm.literal).toBe(atom.token.literal);
            }
          });
        } else {
          expect(value.trueExpr instanceof expression.trueArm.expr).toBe(
            true,
          );
        }

        if (
          expression.condition.expr.prototype instanceof
          SuffixTerm.SuffixTermBase
        ) {
          testSuffixTerm(value.condition, atom => {
            expect(atom instanceof expression.condition.expr).toBe(true);
            if (atom instanceof SuffixTerm.Literal) {
              expect(expression.condition.literal).toBe(atom.token.literal);
            }
          });
        } else {
          expect(value.condition instanceof expression.condition.expr).toBe(
            true,
          );
        }

        if (
          expression.falseArm.expr.prototype instanceof
          SuffixTerm.SuffixTermBase
        ) {
          testSuffixTerm(value.falseExpr, atom => {
            expect(atom instanceof expression.falseArm.expr).toBe(true);
            if (atom instanceof SuffixTerm.Literal) {
              expect(expression.falseArm.literal).toBe(atom.token.literal);
            }
          });
        } else {
          expect(value.falseExpr instanceof expression.falseArm.expr).toBe(
            true,
          );
        }
      }
    }
  });
});

interface IVarDeclareTest {
  source: string;
  identifier: string;
  scope: ScopeKind;
  value: Constructor<Expr.Expr>;
}

const varDeclareTest = (
  source: string,
  identifier: string,
  scope: ScopeKind,
  value: Constructor<Expr.Expr>,
): IVarDeclareTest => {
  return {
    source,
    identifier,
    scope,
    value,
  };
};

interface ILockDeclareTest {
  source: string;
  identifier: string;
  scope?: ScopeKind;
  value: Constructor<Expr.Expr>;
}

const lockDeclareTest = (
  source: string,
  identifier: string,
  value: Constructor<Expr.Expr>,
  scope?: ScopeKind,
): ILockDeclareTest => {
  return {
    source,
    identifier,
    scope,
    value,
  };
};

describe('Parse statement', () => {
  test('valid variable declarations', () => {
    const validDeclarations = [
      varDeclareTest(
        'local a is { return 10. }.',
        'a',
        ScopeKind.local,
        Expr.Lambda,
      ),
      varDeclareTest(
        'declare other to "example" + "another".',
        'other',
        ScopeKind.local,
        Expr.Binary,
      ),
      varDeclareTest(
        'declare global another is thing:withSuffix[10].',
        'another',
        ScopeKind.global,
        Expr.Suffix,
      ),
    ];

    for (const declaration of validDeclarations) {
      const { script, parseErrors } = parse(declaration.source);

      expect(parseErrors.length).toBe(0);
      expect(script.stmts.length).toBe(1);
      expect(script.runStmts.length).toBe(0);

      const [stmt] = script.stmts;

      expect(stmt instanceof Decl.Var).toBe(true);

      if (stmt instanceof Decl.Var) {
        expect(stmt.identifier.lexeme).toBe(declaration.identifier);
        expect(stmt.scope.type).toBe(declaration.scope);
        expect(stmt.value instanceof declaration.value).toBe(true);
      }
    }
  });

  test('valid lock declarations', () => {
    const validDeclarations = [
      lockDeclareTest('lock a to { return 10. }.', 'a', Expr.Lambda, undefined),
      lockDeclareTest(
        'local lock other to "example" + "another".',
        'other',
        Expr.Binary,
        ScopeKind.local,
      ),
      lockDeclareTest(
        'declare global lock another to thing:withSuffix[10].',
        'another',
        Expr.Suffix,
        ScopeKind.global,
      ),
    ];

    for (const declaration of validDeclarations) {
      const { script, parseErrors } = parse(declaration.source);

      expect(parseErrors.length).toBe(0);
      expect(script.stmts.length).toBe(1);
      expect(script.runStmts.length).toBe(0);

      const [stmt] = script.stmts;

      expect(stmt instanceof Decl.Lock).toBe(true);

      if (stmt instanceof Decl.Lock) {
        expect(stmt.identifier.lexeme).toBe(declaration.identifier);
        if (empty(declaration.scope)) {
          expect(stmt.scope).toBeUndefined();
        } else {
          if (empty(stmt.scope)) {
            fail();
          } else {
            expect(stmt.scope.type).toBe(declaration.scope);
          }
        }

        expect(stmt.value instanceof declaration.value).toBe(true);
      }
    }
  });
});
