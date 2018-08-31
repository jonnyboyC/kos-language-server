import { TokenType } from './tokentypes';

export interface TokenMap {
    readonly [key: string]: TokenType
}

export interface SyntaxErrorInterface {
    readonly tag: 'syntaxError',
    readonly message: string;
    readonly start: MarkerInterface;
    readonly end: MarkerInterface;
}

export interface WhiteSpaceInterface {
    readonly tag: 'whitespace',
}

export interface TokenInterface {
    readonly tag: 'token',
    readonly type: TokenType,
    readonly lexeme: string,
    readonly literal: any;
    readonly start: MarkerInterface;
    readonly end: MarkerInterface;
    toString: () => string;
}

export interface MarkerInterface {
    readonly line: number;
    readonly column: number;
}

export type ScanResult = TokenInterface | SyntaxErrorInterface | WhiteSpaceInterface;

