import { SyntaxErrorInterface, MarkerInterface } from './types';

export class SyntaxError implements SyntaxErrorInterface {
    public readonly start: MarkerInterface;
    public readonly end: MarkerInterface;

    public readonly message: string;

    public constructor(message: string, start: MarkerInterface, end: MarkerInterface) {
        this.message = message;
        this.start = start;
        this.end = end;
    }

    public get tag(): 'syntaxError' {
        return 'syntaxError';
    }
}
