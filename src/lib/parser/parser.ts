import { TokenInterface } from '../scanner/types';
import { TokenType } from '../scanner/tokentypes';
import { ParseErrorInterface, ExprResult, TokenResult, ParseResult, InstructionResult, ExprInterface, Scope, InstInterface } from './types';
import { ParseError } from './parserError';
import { Expr, ExprLiteral, ExprGrouping, ExprVariable, ExprCall, ExprDelegate, ExprArrayBracket, ExprArrayIndex, ExprFactor, ExprUnary, ExprBinary, ExprSuffix } from './expr';
import { Inst, InstructionBlock, VariableDeclaration, OnOffInst, CommandInst, CommandExpressionInst, UnsetInst, UnlockInst, SetInst, LockInst, LazyGlobalInst, ElseInst, IfInst, UntilInst, FromInst, WhenInst, ReturnInst, SwitchInst, ForInst, OnInst, ToggleInst, WaitInst, LogInst, CopyInst, RenameInst, DeleteInst, RunInst, RunPathInst } from './inst';
import { Token } from '../scanner/token';

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

    // testing function / utility
    public parseInstruction = (): InstructionResult => {
        try {
            return this.instruction();
        } catch (error) {
            if (error instanceof ParseError) {
                return error;
            }
            throw error;
        }
    }

    public instruction = (): InstInterface => {
        const temp = this.error(this.peek(), 'fake');

        switch (this.peek().type) {
            case TokenType.CurlyOpen:
                this.advance();
                return this.instructionBlock();
            case TokenType.Integer:
            case TokenType.Double:
            case TokenType.True:
            case TokenType.False:
            case TokenType.Identifier:
            case TokenType.FileIdentifier:
            case TokenType.BracketOpen:
            case TokenType.String:
                this.advance();
                return this.identifierLedInstruction();
            case TokenType.Stage:
            case TokenType.Clearscreen:
            case TokenType.Preserve:
            case TokenType.Reboot:
            case TokenType.Shutdown:
                this.advance();
                return this.command();;
            case TokenType.Edit:
            case TokenType.Add:
            case TokenType.Remove:
                this.advance();
                return this.commandExpression();
            case TokenType.Unset:
                this.advance();
                return this.unset();
            case TokenType.Unlock:
                this.advance();
                return this.unlock();
            case TokenType.Set:
                this.advance();
                return this.set();
            case TokenType.Lock:
                this.advance();
                return this.lock();
            case TokenType.LazyGlobal:
                this.advance();
                return this.lazyGlobal();
            case TokenType.If:
                this.advance();
                return this.ifInst();
            case TokenType.Until:
                this.advance();
                return this.until();
            case TokenType.From:
                this.advance();
                return this.from();
            case TokenType.When:
                this.advance();
                return this.when();
            case TokenType.Return:
                this.advance();
                return this.returnInst();
            case TokenType.Switch:
                this.advance();
                return this.switchInst();
            case TokenType.For:
                this.advance();
                return this.forInst();
            case TokenType.On:
                this.advance();
                return this.on();
            case TokenType.Toggle:
                this.advance();
                return this.toggle();
            case TokenType.Wait:
                this.advance();
                return this.wait();
            case TokenType.Log:
                this.advance();
                return this.log();
            case TokenType.Copy:
                this.advance();
                return this.copy();
            case TokenType.Rename:
                this.advance();
                return this.rename();
            case TokenType.Delete:
                this.advance();
                return this.delete();
            case TokenType.Run:
                this.advance();
                return this.run();
            case TokenType.RunPath:
                this.advance();
                return this.runPath();
            case TokenType.RunOncePath:
                this.advance();
                return temp;
            case TokenType.Compile:
                this.advance();
                return temp;
            case TokenType.List:
                this.advance();
                return temp;
            case TokenType.Period:
                this.advance();
                return temp;
            default:
                throw this.error(this.peek(), 'expected instruction TODO express all valid instruction leads');
        }
    }

    // parse a block of instructions
    private instructionBlock = (): InstInterface => {
        const open = this.previous();
        const instructions: Inst[] = [];

        // while not at end and until closing curly keep parsing instructions
        while (!this.check(TokenType.CurlyClose) && !this.isAtEnd()) {
            const instruction = this.instruction();
            instructions.push(instruction);
        }

        // check closing curly is found
        const close = this.consume('Expected "}" to finish instruction block', TokenType.CurlyClose);
        return new InstructionBlock(open, instructions, close);
    }

    // parse an instruction lead with a identifier
    private identifierLedInstruction = (): InstInterface => {
        const suffix = this.suffix();

        if (this.match(TokenType.To, TokenType.Is)) {
            return this.variableDeclaration(suffix);
        }
        if (this.match(TokenType.On, TokenType.Off)) {
            return this.onOff(suffix);
        }

        throw this.error(this.peek(), 'Expected "to", "is", "on", "off"');
    } 

    // parse a variable declaration, scoping occurs elseware
    private variableDeclaration = (suffix: ExprInterface, scope?: Scope): InstInterface => {
        const toIs = this.previous();
        const value = this.expression();
        this.terminal();

        return new VariableDeclaration(suffix, toIs, value, scope);
    }

    // parse on off statement
    private onOff = (suffix: ExprInterface): InstInterface => {
        const onOff = this.previous();
        this.terminal();

        return new OnOffInst(suffix, onOff);
    }

    // parse command instruction
    private command = (): InstInterface => {
        const command = this.previous();
        const period = this.terminal();

        return new CommandInst(command)
    }

    // parse command instruction
    private commandExpression = (): InstInterface => {
        const command = this.previous();
        const expression = this.expression();
        this.terminal();

        return new CommandExpressionInst(command, expression)
    }

    // parse unset instruction
    private unset = (): InstInterface => {
        const unset = this.previous();
        const identifer = this.consume('Excpeted identifier or "all".', TokenType.Identifier, TokenType.All);

        return new UnsetInst(unset, identifer);
    }

    // parse unlock instruction
    private unlock = (): InstInterface => {
        const unlock = this.previous();
        const identifer = this.consume('Excpeted identifier or "all".', TokenType.Identifier, TokenType.All);

        return new UnlockInst(unlock, identifer);
    }

    // parse set instruction
    private set = (): InstInterface => {
        const set = this.previous();
        const suffix = this.suffix();
        const to = this.consume('Expected "to".', TokenType.To);
        const value = this.expression();

        return new SetInst(set, suffix, to, value);
    }

    // parse lock instruction
    private lock = (): InstInterface => {
        const lock = this.previous();
        const identifer = this.consume('Expected identifier.', TokenType.Identifier);
        const to = this.consume('Expected "to".', TokenType.To);
        const value = this.expression();

        return new LockInst(lock, identifer, to, value);
    }

    // parse lazy global
    private lazyGlobal = (): InstInterface => {
        const atSign = this.previous();
        const lazyGlobal = this.consume('Expected keyword "lazyGlobal".', TokenType.LazyGlobal);

        const onOff = this.consume('Expected "on" or "off".', TokenType.On, TokenType.Off);
        this.terminal();

        return new LazyGlobalInst(atSign, lazyGlobal, onOff);
    }

    // parse if instruction
    private ifInst = (): InstInterface => {
        const ifToken = this.previous();
        const condition = this.expression();

        const instruction = this.instruction();
        this.match(TokenType.Period);

        // if else if found parse that branch
        if (this.match(TokenType.Else)) {
            const elseToken = this.previous();
            const elseInstruction = this.instruction();

            const elseInst = new ElseInst(elseToken, elseInstruction);
            this.match(TokenType.Period);
            return new IfInst(ifToken, condition, instruction, elseInst);
        }

        return new IfInst(ifToken, condition, instruction);
    }

    // parse until instruction
    private until = (): InstInterface => {
        const until = this.previous();
        const condition = this.expression();
        const instruction = this.instruction();
        this.match(TokenType.Period);

        return new UntilInst(until, condition, instruction);
    }

    // parse from instruction
    private from = (): InstInterface => {
        const from = this.previous();
        const initializer = this.instructionBlock();
        const until = this.consume('Expected "until".', TokenType.Until);
        const condition = this.expression();
        const increment = this.instructionBlock();
        const doToken = this.consume('Expected "do".', TokenType.Do);
        const instruction = this.instruction();

        return new FromInst(from, initializer, until, condition, increment, doToken, instruction);
    }

    // parse when instruction
    private when = (): InstInterface => {
        const when = this.previous();
        const condition = this.expression();

        const then = this.consume('Expected "then".', TokenType.Then);
        const instruction = this.instruction();
        this.match(TokenType.Period);

        return new WhenInst(when, condition, then, instruction);
    }

    // parse return instruction
    private returnInst = (): InstInterface => {
        const returnToken = this.previous();
        const value = !this.check(TokenType.Period)
            ? this.expression()
            : undefined
        this.terminal();

        return new ReturnInst(returnToken, value);
    }

    // parse switch instruction
    private switchInst = (): InstInterface => {
        const switchToken = this.previous();
        const to = this.consume('Expected "to".', TokenType.To);
        const target = this.expression();
        this.terminal();

        return new SwitchInst(switchToken, to, target);
    }

    // parse for instruction
    private forInst = (): InstInterface => {
        const forToken = this.previous();
        const identifer = this.consume('Expected identifier.', TokenType.Identifier);
        const inToken = this.consume('Expected "in".', TokenType.In);
        const suffix = this.suffix();
        const instruction = this.instruction();
        this.match(TokenType.Period);

        return new ForInst(forToken, identifer, inToken, suffix, instruction);
    }

    // parse on instruction
    private on = (): InstInterface => {
        const on = this.previous();
        const suffix = this.suffix();
        const instruction = this.instruction();
        
        return new OnInst(on, suffix, instruction);
    }

    // parse toggle instruction
    private toggle = (): InstInterface => {
        const toggle = this.previous();
        const suffix = this.suffix();
        this.match(TokenType.Period);
        this.terminal();

        return new ToggleInst(toggle, suffix);
    }

    // parse wait instruction
    private wait = (): InstInterface => {
        const wait = this.previous();
        const until = this.match(TokenType.Until)
            ? this.previous()
            : undefined;

        const expression = this.expression();
        this.terminal();

        return new WaitInst(wait, expression, until);
    }

    // parse log instruction
    private log = (): InstInterface => {
        const log = this.previous();
        const expression = this.expression();
        const to = this.consume('Expected "to".', TokenType.To);
        const target = this.expression();
        this.terminal();

        return new LogInst(log, expression, to, target);
    }

    // parse copy instruction
    private copy = (): InstInterface => {
        const copy = this.previous();
        const expression = this.expression();
        const toFrom = this.consume('Expected "to" or "from".', 
            TokenType.From, TokenType.To);
        const target = this.expression();
        this.terminal();
        
        return new CopyInst(copy, expression, toFrom, target);
    }

    // parse rename instruction
    private rename = (): InstInterface => {
        const rename = this.previous();
        const ioIdentifier = this.consume('Expected identifier or file identifier',
            TokenType.Identifier, TokenType.FileIdentifier);

        const expression = this.expression();
        const to = this.consume('Expected "to".', TokenType.To);
        const target = this.expression();
        this.terminal();

        return new RenameInst(rename, ioIdentifier, expression, to, target);
    }

    // parse delete
    private delete = (): InstInterface => {
        const deleteToken = this.previous();
        const expression = this.expression();

        if (this.match(TokenType.From)) {
            const from = this.previous();
            const target = this.expression();
            this.terminal();

            return new DeleteInst(deleteToken, expression, from, target);
        }

        this.terminal();
        return new DeleteInst(deleteToken, expression);
    }

    // parse run
    private run = (): InstInterface => {
        const run = this.previous();
        const once = this.match(TokenType.Once)
            ? this.previous()
            : undefined;
        
        const identifier = this.consume('Expected string or fileidentifier.',
            TokenType.String, TokenType.FileIdentifier);
        
        // parse arguments if found
        if (this.match(TokenType.BracketOpen)) {
            const open = this.previous();
            const args = this.arguments();
            const close = this.consume('Expected ")".', TokenType.BracketClose);
            this.terminal();
            
            return new RunInst(run, identifier, once, open, args, close);
        }

        this.terminal();
        return new RunInst(run, identifier, once);
    }

    // parse run path
    private runPath = (): InstInterface => {
        const runPath = this.previous();
        const open = this.consume('Expected "(".', TokenType.BracketOpen);
        const expression = this.expression();
        const args = this.match(TokenType.Comma)
            ? this.arguments()
            : undefined;

        const close = this.consume('Expected ")".', TokenType.BracketClose);
        this.terminal();

        return new RunPathInst(runPath, open, expression, close, args);
    }

    // testing function / utility
    public parseExpression = (): ExprResult => {
        try {
            return this.expression();
        } catch(error) {
            if (error instanceof ParseError) {
                return error;
            }
            throw error;
        }
    }

    // parse any expression
    private expression = (): ExprInterface => {
        return this.or();
    }

    // parse or expression
    private or = (): ExprInterface => {
        return this.binaryExpression(this.and, TokenType.Or);
    }

    // parse and expression
    private and = (): ExprInterface => {
        return this.binaryExpression(this.equality, TokenType.And)
    }

    // parse equality expression
    private equality = (): ExprInterface => {
        return this.binaryExpression(this.comparison,
            TokenType.Equal, TokenType.NotEqual);
    }

    // parse comparison expression
    private comparison = (): ExprInterface => {
        return this.binaryExpression(this.addition,
            TokenType.Less, TokenType.Greater,
            TokenType.LessEqual, TokenType.GreaterEqual);
    }

    // parse addition expression
    private addition = (): ExprInterface => {
        return this.binaryExpression(this.multiplication,
            TokenType.Plus, TokenType.Minus);
    }

    // parse multiplication expression
    private multiplication = (): ExprInterface => {
        return this.binaryExpression(this.unary, 
                TokenType.Multi, TokenType.Div);
    }

    // binary expression parser
    private binaryExpression = (recurse: () => ExprInterface, ...types: TokenType[]): ExprInterface => {
        let expr = recurse();

        while (this.match(...types)) {
            const operator = this.previous();
            const right = recurse();
            expr = new ExprBinary(expr, operator, right);
        }

        return expr;
    }

    // parse unary expression
    private unary = (): ExprInterface => {
        // if unary token found parse as unary
        if (this.match(TokenType.Plus, TokenType.Minus,
                TokenType.Not, TokenType.Defined)) {
            const operator = this.previous();
            const unary = this.unary();
            return new ExprUnary(operator, unary)
        }

        // else parse plain factor
        return this.factor();
    }

    // parse factor expression
    private factor = (): ExprInterface => {
        // parse suffix
        let expr = this.suffix();

        // parse seqeunce of factors if they exist
        while (this.match(TokenType.Power)) {
            const power = this.previous();
            const exponenent = this.suffix();
            expr = new ExprFactor(expr, power, exponenent);
        }

        return expr;
    }

    // parse suffix
    private suffix = (): ExprInterface => {
        let expr = this.suffixTerm();

        // while colons are found parse all trailers
        while (this.match(TokenType.Colon)) {
            expr = this.suffixTrailer(expr);
        }

        return expr;
    }

    // parse suffix trailer expression
    private suffixTrailer = (suffix: Expr): ExprInterface => {
        const colon = this.previous();
        const trailer = this.suffixTerm();
        return new ExprSuffix(suffix, colon, trailer);
    }

    // parse suffix term expression
    private suffixTerm = (): ExprInterface => {
        // parse primary
        let expr = this.primary();

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
        }

        return expr;
    }

    // function call
    private functionTrailer = (callee: Expr): ExprInterface => {
        const open = this.previous();
        const args = this.arguments();
        if (isArgsError(args)) throw args;

        const close = this.consume('Expect ")" after arguments.', TokenType.BracketClose);
        
        return new ExprCall(callee, open, args, close);
    }

    // get an argument list
    private arguments = (): ExprInterface[] => {
        const args: ExprInterface[] = [];
        if (!this.check(TokenType.BracketClose)) {
            do {
                const arg = this.expression();
                args.push(arg);
            } while(this.match(TokenType.Comma))
        }
        
        return args
    }

    // generate array bracket expression
    private arrayBracket = (array: Expr): ExprInterface => {
        const open = this.previous();
        const index = this.expression();

        const close = this.consume('Expected "]" at end of array index.', TokenType.BracketClose)
        return new ExprArrayBracket(array, open, index, close);
    }

    // generate array index expression
    private arrayIndex = (array: Expr): ExprInterface => {
        const indexer = this.previous();
     
        // check for integer or identifier
        const index = this.consume('Expected integer or identifer.', 
            TokenType.Integer, TokenType.Identifier)
        
        return new ExprArrayIndex(array, indexer, index);
    }

    // match primary expressions literals, identifers, and parenthesis
    private primary = (): ExprInterface => {
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
            const close = this.consume('Expect ")" after expression', TokenType.BracketClose);
            
            return new ExprGrouping(open, expr, close);
        }

        // valid expression not found
        throw this.error(this.peek(), 'Expected expression.');
    }

    // determine if current token matches a set of tokens
    private match = (...types: TokenType[]): boolean => {
        const found = types.some(t => this.check(t));
        if (found) this.advance();

        return found;
    }

    private terminal = (): TokenResult => {
        return this.consume('Expected ".".', TokenType.Period);
    }

    // consume current token if it matches type. 
    // returns erros if incorrect token is found
    private consume = (message: string, ...tokenType: TokenType[]): TokenInterface => {
        if (this.match(...tokenType)) return this.previous();
        throw this.error(this.peek(), message);
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