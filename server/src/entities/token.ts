import { TokenType } from './tokentypes';
import { Position } from 'vscode-languageserver';
import { IToken } from './types';

export class Token implements IToken {
    public readonly type: TokenType;
    public readonly lexeme: string;
    public readonly literal: any;
    public readonly start: Position;
    public readonly end: Position
    ;

    constructor(type: TokenType, lexeme: string, literal: any, start: Position, end: Position) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.start = start;
        this.end = end;
    }

    public get tag(): 'token' {
        return 'token';
    }

    public get typeString(): string {
        return TokenType[this.type]
    }

    public toString(): string {
        if (this.literal) {
            return `${this.typeString} ${this.lexeme} ${this.literal}`;
        }
        return `${this.typeString} ${this.lexeme}`;
    }
}

export class Marker implements Position {
    public readonly line: number;
    public readonly character: number;

    constructor(line: number, character: number) {
        this.line = line;
        this.character = character;
    }
}