import test from 'ava';
import { Scanner } from '../scanner/scanner';
import { Parser } from './parser';
import { IToken, ISyntaxError } from '../scanner/types';
import { IParseError, IExpr, ExprResult } from './types';
import { ExprLiteral, ExprVariable, ExprCall } from './expr';
import { TokenType } from '../scanner/tokentypes';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

// scan source file
const scan = (source: string) => {
    const scanner = new Scanner(source);
    return scanner.scanTokens();
}

// parse source
const parseExpression = (source: string) => {
    const tokens = scan(source);
    if (isError(tokens)) return tokens;

    const parser = new Parser(tokens);
    return parser.parseExpression();
}

const testDir = join(__dirname, '../../../kerboscripts');

type callbackFunc = (fileName: string) => void;

const walkDir = (dir: string, callback: callbackFunc): void => {
    readdirSync(dir).forEach( f => {
      let dirPath = join(dir, f);
      let isDirectory = statSync(dirPath).isDirectory();
      isDirectory ? 
        walkDir(dirPath, callback) : callback(join(dir, f));
    });
};

test('parse all', (t) => {
    walkDir(testDir, (filePath) => {
        const kosFile = readFileSync(filePath, 'utf8');

        const scanner = new Scanner(kosFile);
        const result = scanner.scanTokens();

        if(isToken(result)) {
            const parser = new Parser(result);
            const parseResult = parser.parse();

            t.deepEqual(0, parseResult[1].length)
        }
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
}

// test basic literal
test('basic valid literal', (t) => {
    const validExpressions = [
        atomTest('5', TokenType.Integer, 5), 
        atomTest('10e6', TokenType.Double, 10e6), 
        atomTest('"Test string"', TokenType.String, "test string"),
        atomTest('"true if until"', TokenType.String, "true if until"),
        atomTest('true', TokenType.True, true), 
        atomTest('false', TokenType.False, false), 
    ];

    for (let expression of validExpressions) {
        const result = parseExpression(expression.source);
        t.true(isLiteral(result))
        if (isLiteral(result)) {
            t.deepEqual(expression.type, result.token.type);
            t.deepEqual(expression.literal, result.token.literal)
        }
    }
})

// test basic literal
test('basic invalid literal', (t) => {
    const validExpressions = [
        atomTest('-', TokenType.Integer, 5), 
        atomTest('"Test string', TokenType.String, "test string"),
        atomTest('until', TokenType.String, "true if until"),
    ];

    for (let expression of validExpressions) {
        const result = parseExpression(expression.source);
        t.false(isLiteral(result))
    }
})

// test basic identifier
test('basic valid identifier', (t) => {
    const validExpressions = [
        atomTest('α', TokenType.Identifier, undefined),
        atomTest('until123OtherStuff', TokenType.Identifier, undefined), 
        atomTest('_variableName', TokenType.Identifier, undefined), 
        atomTest('БНЯД.БНЯД', TokenType.FileIdentifier, undefined),
        atomTest('fileVariable.thing', TokenType.FileIdentifier, undefined),
    ];

    for (let expression of validExpressions) {
        const result = parseExpression(expression.source);
        t.true(isVariable(result))
        if (isVariable(result)) {
            t.deepEqual(expression.type, result.token.type);
            t.deepEqual(expression.literal, result.token.literal)
        }
    }
})

// test basic identifier
test('basic invalid identifier', (t) => {
    const validExpressions = [
        atomTest('11α', TokenType.Identifier, undefined),
        atomTest('+until123OtherStuff', TokenType.Identifier, undefined), 
        atomTest(',БНЯД', TokenType.FileIdentifier, undefined),
    ];

    for (let expression of validExpressions) {
        const result = parseExpression(expression.source);
        t.false(isVariable(result))
    }
})

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
}

// test basic identifier
test('valid call', (t) => {
    const validExpressions = [
        callTest('test(4, "car")', "test", [ExprLiteral, ExprLiteral]),
        callTest('БНЯД(varName, 14.3)', "бняд", [ExprVariable, ExprLiteral]), 
        callTest('_variableName()', "_variablename", []), 
    ];

    for (let expression of validExpressions) {
        const result = parseExpression(expression.source);
        t.true(isCall(result))
        if (isCall(result)) {
            if (isVariable(result.callee)) {
                t.deepEqual(expression.callee, result.callee.token.lexeme);
                t.deepEqual(expression.args.length, result.args.length);
                for (let i = 0; i < expression.args.length; i++) {
                    t.true(result.args[i] instanceof expression.args[i]);
                }
            }
        }
    }
})

// test basic identifier
test('invalid call', (t) => {
    const validExpressions = [
        atomTest('11α', TokenType.Identifier, undefined),
        atomTest('+until123OtherStuff', TokenType.Identifier, undefined), 
        atomTest(',БНЯД', TokenType.FileIdentifier, undefined),
    ];

    for (let expression of validExpressions) {
        const result = parseExpression(expression.source);
        t.false(isVariable(result))
    }
})

// interface ArgumentTestInterface {
//     type: TokenType
// }

const isCall = (literalTest: ExprResult | ISyntaxError[]): literalTest is ExprCall => {
    return isExpr(literalTest) && literalTest instanceof ExprCall;
}

const isLiteral = (literalTest: ExprResult | ISyntaxError[]): literalTest is ExprLiteral => {
    return isExpr(literalTest) && literalTest instanceof ExprLiteral;
}

const isVariable = (literalTest: ExprResult | ISyntaxError[]): literalTest is ExprVariable => {
    return isExpr(literalTest) && literalTest instanceof ExprVariable;
}

const isExpr = (result: IParseError | IExpr | ISyntaxError[]): result is IExpr => {
    return !(result instanceof Array) && result.tag === 'expr';
} 

const isError = (result: IToken[] | ISyntaxError[]): result is ISyntaxError[] => {
    return result[0].tag === 'syntaxError'
}

const isToken = (result: IToken[] | ISyntaxError[]): result is IToken[] => {
    return result[0].tag === 'token'
}