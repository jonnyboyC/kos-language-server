import { TokenInterface, MarkerInterface } from './types';
import { TokenType } from './tokentypes';

export class Token implements TokenInterface {
    public readonly type: TokenType;
    public readonly lexeme: string;
    public readonly literal: any;
    public readonly start: MarkerInterface;
    public readonly end: MarkerInterface
    ;

    constructor(type: TokenType, lexeme: string, literal: any, start: MarkerInterface, end: MarkerInterface) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.start = start;
        this.end = end;
    }

    public get tag(): 'token' {
        return 'token';
    }

    public toString(): string {
        return `${this.type} ${this.lexeme} ${this.literal}`
    }
}

export class Marker implements MarkerInterface {
    public readonly line: number;
    public readonly column: number;

    constructor(line: number, column: number) {
        this.line = line;
        this.column = column;
    }
}