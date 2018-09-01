import test from 'ava';
import { Scanner } from '../scanner/scanner';
import { Parser } from './parser';
import { TokenInterface, SyntaxErrorInterface } from '../scanner/types';
import { ParseErrorInterface, ExprInterface, ExprResult } from './types';
import { ExprLiteral, ExprVariable } from './expr';
import { TokenType } from '../scanner/tokentypes';

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
    return parser.parse();
}

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
        atomTest('true', TokenType.True, undefined), 
        atomTest('false', TokenType.False, undefined), 
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
        callTest('', TokenType.Identifier, undefined),
        callTest('until123OtherStuff', TokenType.Identifier, undefined), 
        callTest('_variableName', TokenType.Identifier, undefined), 
        callTest('БНЯД.БНЯД', TokenType.FileIdentifier, undefined),
        callTest('fileVariable.thing', TokenType.FileIdentifier, undefined),
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

const isLiteral = (literalTest: ExprResult | SyntaxErrorInterface[]): literalTest is ExprLiteral => {
    return isExpr(literalTest) && literalTest instanceof ExprLiteral;
}

const isVariable = (literalTest: ExprResult | SyntaxErrorInterface[]): literalTest is ExprLiteral => {
    return isExpr(literalTest) && literalTest instanceof ExprVariable;
}


const isExpr = (result: ParseErrorInterface | ExprInterface | SyntaxErrorInterface[]): result is ExprInterface => {
    return !(result instanceof Array) && result.tag === 'expr';
} 

const isError = (result: TokenInterface[] | SyntaxErrorInterface[]): result is SyntaxErrorInterface[] => {
    return result[0].tag === 'syntaxError'
}