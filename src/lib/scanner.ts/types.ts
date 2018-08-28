import { TokenType } from './tokentypes';

export interface TokenMap {
    [key: string]: TokenType
}

export interface ParseErrorInterface {
    tag: 'error',
    message: string;
    start: MarkerInterface;
    end: MarkerInterface;
}

export interface WhiteSpaceInterface {
    tag: 'whitespace',
}

export interface TokenInterface {
    tag: 'token',
    type: TokenType,
    lexeme: string,
    literal: any;
    start: MarkerInterface;
    end: MarkerInterface;
}

export interface MarkerInterface {
    line: number;
    column: number;
}

export type ParseResult = TokenInterface | ParseErrorInterface | WhiteSpaceInterface;

