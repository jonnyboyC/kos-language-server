import { TokenType } from './tokentypes';
import { TokenMap, ParseResult } from './types';
import { Token, Marker } from './token';
import { WhiteSpace } from './whitespace';
import { ParseError } from './parseError'

export class Scanner {
    private readonly _source: string
    private _start: number;
    private _current: number;
    private _startLine: number;
    private _currentLine: number;

    // scanner initializer
    constructor(source: string) {
        this._source = source.toLowerCase();
        this._start = 0;
        this._current = 0;
        this._startLine = 0;
        this._currentLine = 0;
    }

    // scan all available tokesn
    public ScanToken(): Token[] | ParseError[] {
        // create arrays for valid tokens and encountered errors
        const tokens: Token[] = [];
        const errors: ParseError[] = [];

        // begin scanning
        while (!this.isAtEnd()) 
        {
            this._start = this._current;
            this._startLine = this._currentLine;
            const result = this.scanToken();
            switch (result.tag) {
                case 'token':
                    tokens.push(result);
                    break;
                case 'error':
                    errors.push(result);
                    break;
                case 'whitespace':
                    break;
            }
        }

        // if errors return errors instead
        if (errors) {
            return errors;
        }
        return tokens;
    }

    private scanToken(): ParseResult {
        let c = this.advance();
        switch (c)
        {
            case '(': return this.generateToken(TokenType.BracketOpen);
            case ')': return this.generateToken(TokenType.BracketClose);
            case '{': return this.generateToken(TokenType.CurlyClose);
            case '}': return this.generateToken(TokenType.CurlyClose);
            case '[': return this.generateToken(TokenType.SquareOpen);
            case ']': return this.generateToken(TokenType.SquareClose);
            case ',': return this.generateToken(TokenType.Comma);
            case ':': return this.generateToken(TokenType.Colon);
            case '.': return this.generateToken(TokenType.Period);
            case '@': return this.generateToken(TokenType.AtSign);
            case '#': return this.generateToken(TokenType.ArrayIndex)

            case '^': return this.generateToken(keywords.Power);
            case '+': return this.generateToken(TokenType.Plus);
            case '-': return this.generateToken(TokenType.Minus);
            case '*': return this.generateToken(keywords.Multi);
            case '=': return this.generateToken(TokenType.Equal); 
            case '<': 
                if (this.match('=')) return this.generateToken(TokenType.LessEqual);
                if (this.match('>')) return this.generateToken(TokenType.NotEqual);
                return this.generateToken(TokenType.Less);
            case '>':
                if (this.match('=')) return this.generateToken(TokenType.GreaterEqual);
                return this.generateToken(TokenType.Greater);
            case '/':
                if (this.match('/')) {
                    while(this.peek() !== '\n' && this.isAtEnd()) this.advance();
                    return new WhiteSpace();
                }
                return this.generateToken(TokenType.Div);
            case ' ':
            case '\r':
            case '\t':
                return new WhiteSpace();
            case '\n':
                this._currentLine++;
                return new WhiteSpace();
            case '"':
                return this.string();
            default:
                if (this.isDigit(c)) {
                    return this.number();
                } else if (this.isAlpha(c)) {
                    return this.identifier();
                }
                return this.generateError("Unexpected symbol, uncountered")
        }
    }

    // extract any identifiers
    private identifier(): Token {
        while (this.isAlphaNumeric(this.peek())) this.advance();

        const text = this._source.substr(this._start, this._current - this._start);
        if (keywords.hasOwnProperty(text)) {
            return this.generateToken(keywords[text]);
        } else {
            return this.generateToken(TokenType.Identifier);
        }
    }

    // extract string
    private string(): ParseResult {
        // while closing " not found increment new lines
        while (this.peek() !== '"' && !this.isAtEnd()) {
            if (this.peek() === '\n') this._currentLine++;
            this.advance();
        }

        // if closing " not found report error
        if (this.isAtEnd()) {
            return this.generateError('Expected closing " for string');
        }

        // generate literal
        this.advance();
        const value = this._source.substr(this._start + 1, this._current - this._start - 2);
        return this.generateToken(TokenType.String, value);
    }

    // extract number
    private number(): ParseResult {
        this.advanceNumber();

        // if . not found number is an integar
        if (this.peek() !== '.') {
            const intString = this.numberString();
            const int = parseInt(intString);
            return this.generateToken(TokenType.Integer, int);
        }

        // continue parsing float
        if (this.peek() == '.' && this.isDigit(this.peekNext())) 
        {
            this.advance();
            this.advanceNumber();
        }

        // generate float
        const floatString = this.numberString();
        const float = parseFloat(floatString);
        return this.generateToken(TokenType.Double, float);
    }

    // advance number for digits and underscores
    private advanceNumber(): void {
        let current = this.peek();
        while (this.isDigit(current) || this.isUnderScore(current)) {
            this.advance();
            current = this.peek();
        }
    }

    // remove underscores from number string literal
    private numberString(): string {
        return this._source
            .substr(this._start, this._current - this._start)
            .replace('_', '');
    }

    // generate token from provided token type and optional literal
    private generateToken(type: TokenType, literal?: any): Token {
        const text = this._source.substr(this._start, this._current - this._start);
        return new Token(
            type, text, literal, 
            new Marker(this._start, this._startLine),
            new Marker(this._current, this._currentLine)
        );
    }

    private generateError(message: string): ParseError {
        return new ParseError(
            message,
            new Marker(this._start, this._startLine),
            new Marker(this._current, this._currentLine)
        );
    }

    // Is end of file
    private isAtEnd(): boolean {
        return this._current >= this._source.length;
    }

    // peek two spots ahead
    private peekNext(): string {
        if (this._current + 1 >= this._source.length) return '\0';
        return this._source[this._current + 1];
    }

    // peek one spot ahead
    private peek(): string {
        if (this.isAtEnd()) return '\0';
        return this._source[this._current];
    }

    // increment current file pointers and return character
    private advance(): string {
        this._current++;
        return this._source[this._current - 1];
    }

    // determine if character matches expected
    private match(expected: string): boolean {
        if (this.isAtEnd()) return false;
        if (this._source[this._current] != expected) return false;

        this._current++;
        return true;
    }

    // is digit character
    private isDigit(c: string): boolean {
        return c >= '0' && c <= '9'
    }

    // is alpha character
    private isAlpha(c: string): boolean {
        return (c >= 'a' && c <= 'z') ||
            (c >= 'A' && c <= 'Z') ||
            this.isUnderScore(c); 
    }

    // is alpha numeric
    private isAlphaNumeric(c: string): boolean {
        return this.isAlpha(c) || this.isDigit(c);
    }

    // is underscore
    private isUnderScore(c: string): boolean {
        return c === '_'
    }
}

// keyword map
const keywords: TokenMap = {
    'add': TokenType.Add, 
    'and': TokenType.And,
    'all': TokenType.All,
    'at': TokenType.At, 
    'break': TokenType.Break, 
    'clearscreen': TokenType.Clearscreen,
    'compile': TokenType.Compile,
    'copy': TokenType.Copy, 
    'do': TokenType.Do,
    'declare': TokenType.Declare,
    'defined': TokenType.Defined, 
    'delete': TokenType.Delete,
    'e': TokenType.E,
    'edit': TokenType.Edit,
    'else': TokenType.Else, 
    'false': TokenType.False,
    'file': TokenType.File, 
    'for': TokenType.For, 
    'from': TokenType.From,
    'function': TokenType.Function,
    'global': TokenType.Global, 
    'if': TokenType.If, 
    'in': TokenType.In,
    'is': TokenType.Is,
    'lazyglobal': TokenType.LazyGlobal,
    'list': TokenType.List, 
    'local': TokenType.Local, 
    'lock': TokenType.Lock, 
    'log': TokenType.Log,
    'not': TokenType.Not,
    'off': TokenType.Off, 
    'on': TokenType.On,
    'or': TokenType.Or,
    'once': TokenType.Once, 
    'parameter': TokenType.Parameter, 
    'preserve': TokenType.Preserve, 
    'print': TokenType.Print,
    'reboot': TokenType.Reboot, 
    'remove': TokenType.Remove,
    'rename': TokenType.Rename, 
    'return': TokenType.Return, 
    'run': TokenType.Run, 
    'runpath': TokenType.RunPath, 
    'runoncepath': TokenType.RunOncePath,
    'set': TokenType.Set, 
    'shutdown': TokenType.Shutdown,
    'stage': TokenType.Stage, 
    'step': TokenType.Step,
    'switch': TokenType.Switch, 
    'then': TokenType.Then, 
    'to': TokenType.To, 
    'true': TokenType.True,
    'toggle': TokenType.Toggle, 
    'unlock': TokenType.Unlock,
    'unset': TokenType.Unset, 
    'until': TokenType.Until,
    'volume': TokenType.Volume,
    'wait': TokenType.Wait, 
    'when': TokenType.When, 
}