import { TokenType } from './tokentypes';
import { Position } from 'vscode-languageserver';

export interface ITokenMap {
    readonly [key: string]: {
        type: TokenType,
        literal?: any
    }
}

export interface ISyntaxError {
    readonly tag: 'syntaxError',
    readonly message: string;
    readonly start: Position;
    readonly end: Position;
}

export interface IWhiteSpace {
    readonly tag: 'whitespace',
}

export interface IToken {
    readonly tag: 'token',
    readonly type: TokenType,
    readonly lexeme: string,
    readonly literal: any;
    readonly start: Position;
    readonly end: Position;
    toString: () => string;
}

export type ScanResult = IToken | ISyntaxError | IWhiteSpace;

