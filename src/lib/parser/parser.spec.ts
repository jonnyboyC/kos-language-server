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

interface BasicTestInterface {
    source: string;
    type: TokenType;
    literal: any;
}

const basicTest = (source: string, type: TokenType, literal: any): BasicTestInterface => {
    return {
        source,
        type,
        literal,
    };
}

// test basic literal
test('basic valid literal', (t) => {
    const validExpressions = [
        basicTest('5', TokenType.Integer, 5), 
        basicTest('10e6', TokenType.Double, 10e6), 
        basicTest('"Test string"', TokenType.String, "test string"),
        basicTest('"true if until"', TokenType.String, "true if until"),
        basicTest('true', TokenType.True, undefined), 
        basicTest('false', TokenType.False, undefined), 
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
        basicTest('-', TokenType.Integer, 5), 
        basicTest('"Test string', TokenType.String, "test string"),
        basicTest('until', TokenType.String, "true if until"),
    ];

    for (let expression of validExpressions) {
        const result = parseExpression(expression.source);
        t.false(isLiteral(result))
    }
})

// test basic identifier
test('basic valid identifier', (t) => {
    const validExpressions = [
        basicTest('α', TokenType.Identifier, undefined),
        basicTest('until123OtherStuff', TokenType.Identifier, undefined), 
        basicTest('_variableName', TokenType.Identifier, undefined), 
        basicTest('БНЯД.БНЯД', TokenType.FileIdentifier, undefined),
        basicTest('fileVariable.thing', TokenType.FileIdentifier, undefined),
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
        basicTest('11α', TokenType.Identifier, undefined),
        basicTest('+until123OtherStuff', TokenType.Identifier, undefined), 
        basicTest(',БНЯД', TokenType.FileIdentifier, undefined),
    ];

    for (let expression of validExpressions) {
        const result = parseExpression(expression.source);
        t.false(isVariable(result))
    }
})



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