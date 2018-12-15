import { TokenType } from '../entities/tokentypes';
import { Position } from 'vscode-languageserver';
import { IToken } from '../entities/types';

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



export type ScanResult = IToken | ISyntaxError | IWhiteSpace;

