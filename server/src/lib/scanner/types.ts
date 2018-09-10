import { TokenType } from './tokentypes';
import { Position } from 'vscode-languageserver';

export interface TokenMap {
    readonly [key: string]: {
        type: TokenType,
        literal?: any
    }
}

export interface SyntaxErrorInterface {
    readonly tag: 'syntaxError',
    readonly message: string;
    readonly start: Position;
    readonly end: Position;
}

export interface WhiteSpaceInterface {
    readonly tag: 'whitespace',
}

export interface TokenInterface {
    readonly tag: 'token',
    readonly type: TokenType,
    readonly lexeme: string,
    readonly literal: any;
    readonly start: Position;
    readonly end: Position;
    toString: () => string;
}

export type ScanResult = TokenInterface | SyntaxErrorInterface | WhiteSpaceInterface;

