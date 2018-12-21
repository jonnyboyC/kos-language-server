import { ISyntaxError } from './types';
import { Position } from 'vscode-languageserver';

export class KosSyntaxError implements ISyntaxError {
    public readonly start: Position;
    public readonly end: Position;

    public readonly message: string;

    public constructor(message: string, start: Position, end: Position) {
        this.message = message;
        this.start = start;
        this.end = end;
    }

    public get tag(): 'syntaxError' {
        return 'syntaxError';
    }
}
