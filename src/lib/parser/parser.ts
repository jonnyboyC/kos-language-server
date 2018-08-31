import { Token } from "../scanner/token";
import { TokenInterface } from "../scanner/types";
import { TokenType } from "../scanner/tokentypes";
import { ParseErrorInterface, ExprResult, TokenResult, ParseResult } from "./types";
import { ParseError } from "./parserError";
import { Expr, ExprLiteral, ExprGrouping, ExprVariable, ExprCall, ExprDelegate, ExprArrayBracket, ExprArrayIndex, ExprFactor } from "./expr";
import { Stmt } from "./stmt";

export class Parser {
    private readonly _tokens: TokenInterface[]
    private _current: number;

    constructor(tokens: Token[]) {
        this._tokens = tokens;
        this._current = 0;
    }

    public parse(): Stmt[] | ParseError[] {
        const stmts: Stmt[] = [];
        // const errors: ParseError[] = [];
        
        while (!this.isAtEnd) {
            const instruction = this.instruction();

        }    
        return stmts;
    }

    private expression(): ExprResult {

    }

    private factor(): ExprResult {
        let expr = this.suffix();
        if (isError(expr)) return expr;

        while (this.match(TokenType.Power)) {
            const power = this.previous();
            const exponenent = this.suffix();
            if (isError(exponenent)) return exponenent;
            expr = new ExprFactor(expr, power, exponenent);
        }

        return expr;
    }

    private suffix(): ExprResult {
        let expr = this.primary();
        if (expr.tag === 'parseError') {
            return expr;
        }

        while (true) {
            if (this.match(TokenType.ArrayIndex)) {
                expr = this.arrayIndex(expr);
            } else if (this.match(TokenType.SquareOpen)) {
                expr = this.arrayBracket(expr);
            } else if (this.match(TokenType.BracketOpen)) {
                expr = this.functionTrailer(expr);
            } else if (this.match(TokenType.AtSign)) {
                return new ExprDelegate(expr, this.previous());
            } else {
                break;
            }

            if (expr.tag === 'parseError') {
                return expr;
            }
        }

        return expr;
    }

    private functionTrailer(callee: Expr): ExprResult {
        const args: Expr[] = [];
        if (!this.check(TokenType.BracketClose)) {
            do {
                const arg = this.expression();
                if (arg.tag === 'parseError') return arg;
                args.push(arg);
            } while(this.match(TokenType.Comma))
        }

        const paren = this.consume("Expect ')' after arguments.", TokenType.BracketClose);
        if (paren.tag === 'parseError') {
            return paren;
        }
        
        return new ExprCall(callee, args, paren);
    }

    private arrayBracket(array: Expr): ExprResult {
        const open = this.previous();
        const index = this.expression();

        if (index.tag === 'parseError') return index;
        const close = this.consume("Expected ']' at end of array index.", TokenType.BracketClose)
        if (close.tag === 'parseError') return close;
        return new ExprArrayBracket(array, open, index, close);
    }

    private arrayIndex(array: Expr): ExprResult {
        const indexer = this.previous();
     
        const index = this.match(TokenType.Integer, TokenType.Identifier)
            ? this.previous()
            : this.error(this.previous(), "Expected integer or identifer.");
        
        if (index.tag === 'parseError') return index;
        return new ExprArrayIndex(array, indexer, index);
    }

    private primary(): ExprResult {
        if (this.match(TokenType.False, TokenType.True,
            TokenType.String, TokenType.Integer, TokenType.Double)) {
            return new ExprLiteral(this.previous());
        }

        if (this.match(TokenType.Identifier, TokenType.FileIdentifier)) {
            return new ExprVariable(this.previous());
        }

        if (this.match(TokenType.BracketOpen)) {
            const open = this.previous();
            const expr = this.expression();
            if (isError(expr)) return expr;
            const close = this.consume("Expect ')' after expression", TokenType.BracketClose);
            if (isError(close)) return close;
            
            return new ExprGrouping(open, expr, close);
        }

        return this.error(this.peek(), "Expected expression.");
    }

    // determine if current token matches a set of tokens
    private match(...types: TokenType[]) {
        const found = types.some(t => this.check(t));
        if (found) this.advance();

        return found;
    }

    // consume current token if it matches type. 
    // returns erros if incorrect token is found
    private consume(message: string, ...tokenType: TokenType[]): TokenResult {
        if (this.match(...tokenType)) return this.previous();
        return this.error(this.peek(), message);
    }

    // check if current token matches expected type
    private check(tokenType: TokenType): boolean {
        if (this.isAtEnd) return false;
        return this.peek().type === tokenType;
    }

    // return current token and advance
    private advance(): TokenInterface {
        if (!this.isAtEnd) this._current++;
        return this.previous();
    }

    // is parse at the end of file
    private isAtEnd(): boolean {
        return this.peek().type === TokenType.Eof;
    }

    // peek current token
    private peek(): TokenInterface {
        return this._tokens[this._current];
    }

    // retrieve previous token
    private previous(): TokenInterface {
        return this._tokens[this._current - 1];
    }

    // report parse error
    private error(token: TokenInterface, message: string): ParseErrorInterface {
        return new ParseError(token, message);
    }

    // attempt to synchronize parser
    private synchronize(): void {

    }
}

const isError = (result: ParseResult): result is ParseError => {
    return result.tag === 'parseError';
}