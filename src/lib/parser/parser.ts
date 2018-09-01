import { TokenInterface } from "../scanner/types";
import { TokenType } from "../scanner/tokentypes";
import { ParseErrorInterface, ExprResult, TokenResult, ParseResult } from "./types";
import { ParseError } from "./parserError";
import { Expr, ExprLiteral, ExprGrouping, ExprVariable, ExprCall, ExprDelegate, ExprArrayBracket, ExprArrayIndex, ExprFactor, ExprUnary, ExprBinary, ExprSuffix } from "./expr";
// import { Stmt } from "./stmt";

export class Parser {
    private readonly _tokens: TokenInterface[]
    private _current: number;

    constructor(tokens: TokenInterface[]) {
        this._tokens = tokens;
        this._current = 0;
    }

    public parse(): ExprResult {
        // const stmts: Stmt[] = [];
        // const errors: ParseError[] = [];
        
        // while (!this.isAtEnd) {
        //     const instruction = 

        // }    
        return this.expression();
    }

    public parseExpression = (): ExprResult => {
        return this.expression();
    }

    // parse any expression
    private expression = (): ExprResult => {
        return this.or();
    }

    // parse or expression
    private or = (): ExprResult => {
        return this.binaryExpression(this.and, TokenType.Or);
    }

    // parse and expression
    private and = (): ExprResult => {
        return this.binaryExpression(this.equality, TokenType.And)
    }

    // parse equality expression
    private equality = (): ExprResult => {
        return this.binaryExpression(this.comparison,
            TokenType.Equal, TokenType.NotEqual);
    }

    // parse comparison expression
    private comparison = (): ExprResult => {
        return this.binaryExpression(this.addition,
            TokenType.Less, TokenType.Greater,
            TokenType.LessEqual, TokenType.GreaterEqual);
    }

    // parse addition expression
    private addition = (): ExprResult => {
        return this.binaryExpression(this.multiplication,
            TokenType.Plus, TokenType.Minus);
    }

    // parse multiplication expression
    private multiplication = (): ExprResult => {
        return this.binaryExpression(this.unary, 
                TokenType.Multi, TokenType.Div);
    }

    // binary expression parser
    private binaryExpression = (recurse: () => ExprResult, ...types: TokenType[]): ExprResult => {
        let expr = recurse();
        if (isError(expr)) return expr;

        while (this.match(...types)) {
            const operator = this.previous();
            const right = recurse();
            if (isError(right)) return right;
            expr = new ExprBinary(expr, operator, right);
        }

        return expr;
    }

    // parse unary expression
    private unary = (): ExprResult => {
        // if unary token found parse as unary
        if (this.match(TokenType.Plus, TokenType.Minus,
                TokenType.Not, TokenType.Defined)) {
            const operator = this.previous();
            const unary = this.unary();
            if (isError(unary)) return unary;
            return new ExprUnary(operator, unary)
        }

        // else parse plain factor
        return this.factor();
    }

    // parse factor expression
    private factor = (): ExprResult => {
        // parse suffix
        let expr = this.suffix();
        if (isError(expr)) return expr;

        // parse seqeunce of factors if they exist
        while (this.match(TokenType.Power)) {
            const power = this.previous();
            const exponenent = this.suffix();
            if (isError(exponenent)) return exponenent;
            expr = new ExprFactor(expr, power, exponenent);
        }

        return expr;
    }

    // parse suffix
    private suffix = (): ExprResult => {
        let expr = this.suffixTerm();
        if (isError(expr)) return expr;

        // while colons are found parse all trailers
        while (this.match(TokenType.Colon)) {
            expr = this.suffixTrailer(expr);
            if (isError(expr)) return expr;
        }

        return expr;
    }

    // parse suffix trailer expression
    private suffixTrailer = (suffix: Expr): ExprResult => {
        const colon = this.previous();
        const trailer = this.suffixTerm();
        if (isError(trailer)) return trailer;
        return new ExprSuffix(suffix, colon, trailer);
    }

    // parse suffix term expression
    private suffixTerm = (): ExprResult => {
        // parse primary
        let expr = this.primary();
        if (isError(expr)) return expr;

        // parse any trailers that exist
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

            if (isError(expr)) {
                return expr;
            }
        }

        return expr;
    }

    // function call
    private functionTrailer = (callee: Expr): ExprResult => {
        const open = this.previous();
        const args = this.arguments();
        if (isArgsError(args)) return args;

        const close = this.consume("Expect ')' after arguments.", TokenType.BracketClose);
        if (isError(close)) {
            return close;
        }
        
        return new ExprCall(callee, open, args, close);
    }

    // get an argument list
    private arguments = (): Expr[] | ParseError => {
        const args: Expr[] = [];
        if (!this.check(TokenType.BracketClose)) {
            do {
                const arg = this.expression();
                if (isError(arg)) return arg;
                args.push(arg);
            } while(this.match(TokenType.Comma))
        }
        
        return args
    }

    // generate array bracket expression
    private arrayBracket = (array: Expr): ExprResult => {
        const open = this.previous();
        const index = this.expression();

        if (isError(index)) return index;
        const close = this.consume("Expected ']' at end of array index.", TokenType.BracketClose)
        if (isError(close)) return close;
        return new ExprArrayBracket(array, open, index, close);
    }

    // generate array index expression
    private arrayIndex = (array: Expr): ExprResult => {
        const indexer = this.previous();
     
        // check for integer or identifier
        const index = this.consume("Expected integer or identifer.", 
            TokenType.Integer, TokenType.Identifier)
        
        if (isError(index)) return index;
        return new ExprArrayIndex(array, indexer, index);
    }

    // match primary expressions literals, identifers, and parenthesis
    private primary = (): ExprResult => {
        // match all literals
        if (this.match(TokenType.False, TokenType.True,
            TokenType.String, TokenType.Integer, TokenType.Double)) {
            return new ExprLiteral(this.previous());
        }

        // match identifiers
        if (this.match(TokenType.Identifier, TokenType.FileIdentifier)) {
            return new ExprVariable(this.previous());
        }

        // match grouping expression
        if (this.match(TokenType.BracketOpen)) {
            const open = this.previous();
            const expr = this.expression();
            if (isError(expr)) return expr;
            const close = this.consume("Expect ')' after expression", TokenType.BracketClose);
            if (isError(close)) return close;
            
            return new ExprGrouping(open, expr, close);
        }

        // valid expression not found
        return this.error(this.peek(), "Expected expression.");
    }

    // determine if current token matches a set of tokens
    private match = (...types: TokenType[]): boolean => {
        const found = types.some(t => this.check(t));
        if (found) this.advance();

        return found;
    }

    // consume current token if it matches type. 
    // returns erros if incorrect token is found
    private consume = (message: string, ...tokenType: TokenType[]): TokenResult => {
        if (this.match(...tokenType)) return this.previous();
        return this.error(this.peek(), message);
    }

    // check if current token matches expected type
    private check = (tokenType: TokenType): boolean => {
        if (this.isAtEnd()) return false;
        return this.peek().type === tokenType;
    }

    // return current token and advance
    private advance = (): TokenInterface => {
        if (!this.isAtEnd()) this._current++;
        return this.previous();
    }

    // is parse at the end of file
    private isAtEnd = (): boolean => {
        return this.peek().type === TokenType.Eof;
    }

    // peek current token
    private peek = (): TokenInterface => {
        return this._tokens[this._current];
    }

    // retrieve previous token
    private previous = (): TokenInterface =>{
        return this._tokens[this._current - 1];
    }

    // report parse error
    private error = (token: TokenInterface, message: string): ParseErrorInterface => {
        return new ParseError(token, message);
    }

    // attempt to synchronize parser
    // private synchronize(): void {

    // }
}

const isArgsError = (result: Expr[] | ParseError): result is ParseError => {
    return (<ParseError>result).tag !== undefined;
}

const isError = (result: ParseResult): result is ParseError => {
    return result.tag === 'parseError';
}