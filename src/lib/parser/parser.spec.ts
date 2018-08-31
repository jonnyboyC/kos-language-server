import test from 'ava';
import { Scanner } from '../scanner/scanner';
import { Parser } from './parser';
import { TokenInterface, SyntaxErrorInterface } from '../scanner/types';
import { ParseErrorInterface, ExprInterface } from './types';
import { ExprLiteral } from './expr';
// import { readdirSync, readFileSync, statSync } from 'fs'

const scan = (source: string) => {
    const scanner = new Scanner(source);
    return scanner.scanTokens();
}

const parse = (source: string) => {
    const tokens = scan(source);
    if (isError(tokens)) throw Error();

    const parser = new Parser(tokens);
    return parser.parse();
}

test('initial test', (t) => {
    const numberResult = parse('5');
    t.true(isExpr(numberResult))
    if (isExpr(numberResult)) {
        t.true(numberResult instanceof ExprLiteral)
        if (numberResult instanceof ExprLiteral) {
            t.deepEqual(5, numberResult.token.literal)
        }
    }
})

const isExpr = (result: ParseErrorInterface | ExprInterface): result is ExprInterface => {
    return result.tag === 'expr';
} 

const isError = (result: TokenInterface[] | SyntaxErrorInterface[]): result is SyntaxErrorInterface[] => {
    return result[0].tag === 'syntaxError'
}