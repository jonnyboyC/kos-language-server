
import { TokenType, isValidIdentifier } from '../entities/tokentypes';
import { IParseError, ExprResult, TokenResult, InstResult, IExpr, IDeclScope, IInst } from './types';
import { ParseError } from './parserError';
import { Expr, LiteralExpr, GroupingExpr, VariableExpr, CallExpr, DelegateExpr, ArrayBracketExpr, ArrayIndexExpr, FactorExpr, UnaryExpr, BinaryExpr, SuffixExpr, AnonymousFunctionExpr } from './expr';
import { Inst, BlockInst, OnOffInst, CommandInst, CommandExpressionInst, UnsetInst, UnlockInst, SetInst, LazyGlobalInst, ElseInst, IfInst, UntilInst, FromInst, WhenInst, ReturnInst, SwitchInst, ForInst, OnInst, ToggleInst, WaitInst, LogInst, CopyInst, RenameInst, DeleteInst, RunInst, RunPathInst, RunPathOnceInst, CompileInst, ListInst, EmptyInst, PrintInst, ExprInst, BreakInst } from './inst';
import { DeclScope, DeclFunction, DefaultParameter, DeclParameter, DeclVariable, DeclLock } from './declare';
import { empty } from '../utilities/typeGuards';
import { IToken } from '../entities/types';
import { fileInsts } from '../entities/fileInsts';

export class Parser {
    private readonly _tokens: IToken[]
    private _current: number;

    constructor(tokens: IToken[]) {
        this._tokens = tokens;
        this._current = 0;
    }

    // parse tokens
    public parse(): [fileInsts, IParseError[]] {
        const instructions: Inst[] = [];
        const errors: IParseError[] = [];

        // ensure a start of file is present
        this.consumeTokenThrow(`File did not beging with Start of file token`, TokenType.Sof);
        
        while (!this.isAtEnd()) {
            const instruction = this.declaration();
            switch (instruction.tag) {
                case 'inst':
                    instructions.push(instruction);
                    break;
                case 'parseError':
                    errors.push(instruction);
                    break;
            }
        }    
        return [
            new fileInsts(this._tokens[0], instructions, this._tokens[this._tokens.length - 1]), 
            errors
        ];
    }

    // parse declaration attempt to synchronize
    private declaration = (): InstResult => {Function
        try {
            if ([TokenType.Declare, TokenType.Local, TokenType.Global, 
                TokenType.Parameter, TokenType.Function, TokenType.Lock].some(t => this.check(t))) {
                return this.define();
            }
    
            return this.instruction();
        } catch (error) {
            if (error instanceof ParseError) {
                this.synchronize();
                return error;
            }
            throw error;
        }
    }

    // parse declaration instructions
    private define = (): IInst => {
        // attempt to find scoping
        const declare = this.matchToken(TokenType.Declare)
            ? this.previous()
            : undefined;

        const scope = this.matchToken(TokenType.Local, TokenType.Global)
            ? this.previous()
            : undefined;

        const scopeDeclare = declare || scope
            ? new DeclScope(scope, declare)
            : undefined;

        // match declaration
        if (this.matchToken(TokenType.Function)) {
            return this.declareFunction(scopeDeclare);
        }
        if (this.matchToken(TokenType.Parameter)) {
            return this.declareParameter(scopeDeclare);
        }
        if (this.matchToken(TokenType.Lock)) {
            return this.declareLock(scopeDeclare);
        }
        if (scopeDeclare) {
            return this.declareVariable(scopeDeclare);
        }

        throw this.error(this.peek(), 
            'Expected function parameter or variable declaration.', 
            'Example: "local function exampleFunc { ...", "global x is 0"')
    }

    // parse function declaration
    private declareFunction = (scope?: IDeclScope): DeclFunction => {
        const functionToken = this.previous();
        const functionIdentiifer = this.consumeIdentifierThrow("Expected identifier");

        // match function body
        if (this.matchToken(TokenType.CurlyOpen)) {
            const instructionBlock = this.instructionBlock();
            this.matchToken(TokenType.Period);

            return new DeclFunction(functionToken, functionIdentiifer, instructionBlock, scope);
        }

        throw this.error(this.peek(), 
            'Expected function instruction block starting with "{"',
            'Example: local function { print "hi". }')
    }

    // parse parameter declaration
    private declareParameter = (scope?: IDeclScope): DeclParameter => {
        const parameterToken = this.previous();

        const parameters = this.declareNormalParameters();
        const defaultParameters = this.declaredDefaultedParameters();
        this.terminal();

        return new DeclParameter(parameterToken, parameters, defaultParameters, scope);
    }

    // parse regular parameters
    private declareNormalParameters = (): IToken[] => {
        const parameters = [];

        // parse paremter until defaulted
        do {
            // break if this parameter is defaulted
            if (this.checkNext(TokenType.Is) || this.checkNext(TokenType.To)) break;

            const identifer = this.consumeIdentifierThrow(
                'Expected additional identiifer following comma.');

            parameters.push(identifer);
        } while (this.matchToken(TokenType.Comma))

        return parameters;
    }

    // parse defaulted parameters
    private declaredDefaultedParameters = (): DefaultParameter[] => {
        const defaultParameters = [];
        
        // parse until no additional parameters exist
        do {
            if (!this.checkNext(TokenType.Is) && !this.checkNext(TokenType.To)) break;

            const identifer = this.consumeIdentifierThrow(
                'Expected identifier following comma.');
            const toIs = this.consumeTokenThrow(
                'Expected default parameter using keyword "to" or "is".',
                TokenType.To, TokenType.Is);
            const value = this.expression();
            defaultParameters.push(new DefaultParameter(identifer, toIs, value));
        } while (this.matchToken(TokenType.Comma))

        return defaultParameters;
    }

    // parse lock instruction
    private declareLock = (scope?: IDeclScope): DeclLock => {
        const lock = this.previous();
        const identifer = this.consumeIdentifierThrow(
            'Expected identifier following lock keyword.');
        const to = this.consumeTokenThrow(
            'Expected keyword "to" following lock.', 
            TokenType.To);
        const value = this.expression();
        this.terminal();

        return new DeclLock(lock, identifer, to, value, scope);
    }

    // parse a variable declaration, scoping occurs elseware
    private declareVariable = (scope: IDeclScope): DeclVariable => {
        const suffix = this.suffix();

        const toIs = this.consumeTokenThrow(
            'Expected keyword "to" or "is" following declar.', 
            TokenType.To, TokenType.Is);
        const value = this.expression();
        this.terminal();

        return new DeclVariable(suffix, toIs, value, scope);
    }

    // testing function / utility
    public parseInstruction = (): InstResult => {
        try {
            return this.instruction();
        } catch (error) {
            if (error instanceof ParseError) {
                return error;
            }
            throw error;
        }
    }

    // parse instruction
    public instruction = (): IInst => {
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
                // note we don't advance the token index here
                // TODO see if there exists a more general solution
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
            case TokenType.AtSign:
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
            case TokenType.Break:
                this.advance();
                return this.breakInst();
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
                return this.runPathOnce();
            case TokenType.Compile:
                this.advance();
                return this.compile();
            case TokenType.List:
                this.advance();
                return this.list();
            case TokenType.Print:
                this.advance();
                return this.print();
            case TokenType.Period:
                return new EmptyInst(this.advance());
            default:
                throw this.error(this.peek(), 
                    'Unknown instruction found', 
                    'Examples: "print "hi"", "LIST.", "RUN "example.ks""' );
        }
    }

    // parse a block of instructions
    private instructionBlock = (): BlockInst => {
        const open = this.previous();
        const declarations: Inst[] = [];

        const errors: IParseError[] = []

        // while not at end and until closing curly keep parsing instructions
        while (!this.check(TokenType.CurlyClose) && !this.isAtEnd()) {

            const declaration = this.declaration();

            // catch and synchronize errors that occur while parsing the block
            if (declaration.tag === 'inst') {
                declarations.push(declaration);
            } else {
                errors.push(declaration);
            }
        }

        // check closing curly is found
        const close = this.consumeTokenReturn(
            'Expected "}" to finish instruction block', 
            TokenType.CurlyClose);

        // throw and bundle inner error if close not found
        if (close.tag === 'parseError') {
            close.inner = errors;
            throw close;
        }

        // if inner errors found bundle and throw
        if (errors.length > 0) {
            const error = this.error(open, "Error found in this block.");
            error.inner = errors;
            throw error;
        }

        return new BlockInst(open, declarations, close);
    }

    // parse an instruction lead with a identifier
    private identifierLedInstruction = (): IInst => {
        const suffix = this.suffix();

        if (this.matchToken(TokenType.On, TokenType.Off)) {
            return this.onOff(suffix);
        }
        this.terminal();

        return new ExprInst(suffix);
    } 

    // parse on off statement
    private onOff = (suffix: IExpr): OnOffInst => {
        const onOff = this.previous();
        this.terminal();

        return new OnOffInst(suffix, onOff);
    }

    // parse command instruction
    private command = (): CommandInst => {
        const command = this.previous();
        this.terminal();

        return new CommandInst(command)
    }

    // parse command instruction
    private commandExpression = (): CommandExpressionInst => {
        const command = this.previous();
        const expression = this.expression();
        this.terminal();

        return new CommandExpressionInst(command, expression)
    }

    // parse unset instruction
    private unset = (): UnsetInst => {
        const unset = this.previous();
        const identifer = this.consumeTokenThrow(
            'Excpeted identifier or "all" following keyword "unset".', 
            TokenType.Identifier, TokenType.All);
        this.terminal();

        return new UnsetInst(unset, identifer);
    }

    // parse unlock instruction
    private unlock = (): UnlockInst => {
        const unlock = this.previous();
        const identifer = this.consumeTokenThrow(
            'Excpeted identifier or "all" following keyword "unlock".', 
            TokenType.Identifier, TokenType.All);
        this.terminal();

        return new UnlockInst(unlock, identifer);
    }

    // parse set instruction
    private set = (): SetInst => {
        const set = this.previous();
        const suffix = this.suffix();
        const to = this.consumeTokenThrow(
            'Expected "to" following keyword "set".', 
            TokenType.To);
        const value = this.expression();
        this.terminal();

        return new SetInst(set, suffix, to, value);
    }

    // parse lazy global
    private lazyGlobal = (): LazyGlobalInst => {
        const atSign = this.previous();
        const lazyGlobal = this.consumeTokenThrow(
            'Expected keyword "lazyGlobal" following @.', 
            TokenType.LazyGlobal);

        const onOff = this.consumeTokenThrow(
            'Expected "on" or "off" following lazy global directive.', 
            TokenType.On, TokenType.Off);
        this.terminal();

        return new LazyGlobalInst(atSign, lazyGlobal, onOff);
    }

    // parse if instruction
    private ifInst = (): IfInst => {
        const ifToken = this.previous();
        const condition = this.expression();

        const instruction = this.instruction();
        this.matchToken(TokenType.Period);

        // if else if found parse that branch
        if (this.matchToken(TokenType.Else)) {
            const elseToken = this.previous();
            const elseInstruction = this.instruction();

            const elseInst = new ElseInst(elseToken, elseInstruction);
            this.matchToken(TokenType.Period);
            return new IfInst(ifToken, condition, instruction, elseInst);
        }

        return new IfInst(ifToken, condition, instruction);
    }

    // parse until instruction
    private until = (): UntilInst => {
        const until = this.previous();
        const condition = this.expression();
        const instruction = this.instruction();
        this.matchToken(TokenType.Period);

        return new UntilInst(until, condition, instruction);
    }

    // parse from instruction
    private from = (): FromInst => {
        const from = this.previous();
        if (this.matchToken(TokenType.CurlyOpen)) {
            const initializer = this.instructionBlock();
            const until = this.consumeTokenThrow(
                'Expected "until" expression following from.', 
                TokenType.Until);
            const condition = this.expression();
            const step = this.consumeTokenThrow(
                'Expected "step" statment following until.', 
                TokenType.Step);
            if (this.matchToken(TokenType.CurlyOpen)) {
                const increment = this.instructionBlock();
                const doToken = this.consumeTokenThrow(
                    'Expected "do" block following step.', 
                    TokenType.Do);
                const instruction = this.instruction();
                return new FromInst(from, initializer, until, condition, step, increment, doToken, instruction);
            }
            throw this.error(this.peek(), 
                'Expected "{" followed by step block logic.', 
                'Example: FROM {LOCAL x is 0.} UNTIL x >= 10 STEP { set x to x + 1. } { print x. }');
        }
        throw this.error(this.peek(), 
            'Expected "{" followed by initializer logic',
            'Example: FROM {LOCAL x is 0.} UNTIL x >= 10 STEP { set x to x + 1. } { print x. }');
    }

    // parse when instruction
    private when = (): WhenInst => {
        const when = this.previous();
        const condition = this.expression();

        const then = this.consumeTokenThrow(
            'Expected "then" following "when" condition.', 
            TokenType.Then);
        const instruction = this.instruction();
        this.matchToken(TokenType.Period);

        return new WhenInst(when, condition, then, instruction);
    }

    // parse return instruction
    private returnInst = (): ReturnInst => {
        const returnToken = this.previous();
        const value = !this.check(TokenType.Period)
            ? this.expression()
            : undefined
        this.terminal();

        return new ReturnInst(returnToken, value);
    }

    // parse return instruction
    private breakInst = (): BreakInst => {
        const breakToken = this.previous();
        this.terminal();

        return new BreakInst(breakToken);
    }

    // parse switch instruction
    private switchInst = (): SwitchInst => {
        const switchToken = this.previous();
        const to = this.consumeTokenThrow(
            'Expected "to" following keyword "switch".', TokenType.To);
        const target = this.expression();
        this.terminal();

        return new SwitchInst(switchToken, to, target);
    }

    // parse for instruction
    private forInst = (): ForInst => {
        const forToken = this.previous();
        const identifer = this.consumeIdentifierThrow(
            'Expected identifier. following keyword "for"');
        const inToken = this.consumeTokenThrow(
            'Expected "in" after "for" loop variable.', 
            TokenType.In);
        const suffix = this.suffix();
        const instruction = this.instruction();
        this.matchToken(TokenType.Period);

        return new ForInst(forToken, identifer, inToken, suffix, instruction);
    }

    // parse on instruction
    private on = (): OnInst => {
        const on = this.previous();
        const suffix = this.suffix();
        const instruction = this.instruction();
        
        return new OnInst(on, suffix, instruction);
    }

    // parse toggle instruction
    private toggle = (): ToggleInst => {
        const toggle = this.previous();
        const suffix = this.suffix();
        this.terminal();

        return new ToggleInst(toggle, suffix);
    }

    // parse wait instruction
    private wait = (): WaitInst => {
        const wait = this.previous();
        const until = this.matchToken(TokenType.Until)
            ? this.previous()
            : undefined;

        const expression = this.expression();
        this.terminal();

        return new WaitInst(wait, expression, until);
    }

    // parse log instruction
    private log = (): LogInst => {
        const log = this.previous();
        const expression = this.expression();
        const to = this.consumeTokenThrow(
            'Expected "to" following "log" expression.', 
            TokenType.To);
        const target = this.expression();
        this.terminal();

        return new LogInst(log, expression, to, target);
    }

    // parse copy instruction
    private copy = (): CopyInst => {
        const copy = this.previous();
        const expression = this.expression();
        const toFrom = this.consumeTokenThrow(
            'Expected "to" or "from" following "copy" expression.', 
            TokenType.From, TokenType.To);
        const target = this.expression();
        this.terminal();
        
        return new CopyInst(copy, expression, toFrom, target);
    }

    // parse rename instruction
    private rename = (): RenameInst => {
        const rename = this.previous();
        const ioIdentifier = this.consumeTokenThrow(
            'Expected identifier or file identifier following keyword "rename"',
            TokenType.Identifier, TokenType.FileIdentifier);

        const expression = this.expression();
        const to = this.consumeTokenThrow(
            'Expected "to" following keyword "rename".', 
            TokenType.To);
        const target = this.expression();
        this.terminal();

        return new RenameInst(rename, ioIdentifier, expression, to, target);
    }

    // parse delete instruction
    private delete = (): DeleteInst => {
        const deleteToken = this.previous();
        const expression = this.expression();

        if (this.matchToken(TokenType.From)) {
            const from = this.previous();
            const target = this.expression();
            this.terminal();

            return new DeleteInst(deleteToken, expression, from, target);
        }

        this.terminal();
        return new DeleteInst(deleteToken, expression);
    }

    // parse run instruction
    private run = (): RunInst => {
        const run = this.previous();
        const once = this.matchToken(TokenType.Once)
            ? this.previous()
            : undefined;
        
        const identifier = this.consumeTokenThrow(
            'Expected string or fileidentifier following keyword "run".',
            TokenType.String, TokenType.Identifier, TokenType.FileIdentifier);
        
        let open = undefined;
        let args = undefined;
        let close = undefined;

        // parse arguments if found
        if (this.matchToken(TokenType.BracketOpen)) {
            open = this.previous();
            args = this.arguments();
            close = this.consumeTokenThrow(
                'Expected ")" after "run" arguments.', 
                TokenType.BracketClose);
        }

        let on = undefined;
        let expr = undefined;

        // parse arguments if found
        if (this.matchToken(TokenType.On)) {
            on = this.previous();
            args = this.arguments();
            expr = this.expression();
        }

        this.terminal();
        return new RunInst(run, identifier, once, open, args, close, on, expr);
    }

    // parse run path instruction
    private runPath = (): RunPathInst => {
        const runPath = this.previous();
        const open = this.consumeTokenThrow(
            'Expected "(" after keyword "runPath".', 
            TokenType.BracketOpen);
        const expression = this.expression();
        const args = this.matchToken(TokenType.Comma)
            ? this.arguments()
            : undefined;

        const close = this.consumeTokenThrow(
            'Expected ")" after runPath arguments.', 
            TokenType.BracketClose);
        this.terminal();

        return new RunPathInst(runPath, open, expression, close, args);
    }

    // parse run path once instruction
    private runPathOnce = (): RunPathOnceInst => {
        const runPath = this.previous();
        const open = this.consumeTokenThrow(
            'Expected "(" after keyword "runPathOnce".', 
            TokenType.BracketOpen);
        const expression = this.expression();
        const args = this.matchToken(TokenType.Comma)
            ? this.arguments()
            : undefined;

        const close = this.consumeTokenThrow(
            'Expected ")" after runPathOnce arugments.', 
            TokenType.BracketClose);
        this.terminal();

        return new RunPathOnceInst(runPath, open, expression, close, args);
    }

    // parse compile instruction
    private compile = (): CompileInst => {
        const compile = this.previous();
        const expression = this.expression();
        if (this.matchToken(TokenType.To)) {
            const to = this.previous();
            const target = this.expression();
            this.terminal();
        
            return new CompileInst(compile, expression, to, target);
        }

        this.terminal();
        return new CompileInst(compile, expression);
    }

    // parse list instruction
    private list = (): ListInst => {
        const list = this.previous();
        let identifier = undefined;
        let inToken = undefined;
        let target = undefined;

        if (this.matchIdentifier()) {
            identifier = this.previous();
            if (this.matchToken(TokenType.In)) {
                inToken = this.previous();
                target = this.consumeIdentifierThrow('Expected identifier after "in" keyword in "list" command');
            }
        }
        this.terminal();
        
        return new ListInst(list, identifier, inToken, target);
    }

    // parse print instruction
    private print = (): PrintInst => {
        const print = this.previous();
        const expression = this.expression();
        let at = undefined;
        let open = undefined;
        let x = undefined;
        let y = undefined;
        let close = undefined;

        if (this.matchToken(TokenType.At)) {
            at = this.previous();
            open = this.consumeTokenThrow('Expected "(".', TokenType.BracketOpen);
            x = this.expression();
            this.consumeTokenThrow('Expected ",".', TokenType.Comma);
            y = this.expression();
            close = this.consumeTokenThrow('Expected ")".', TokenType.BracketClose);
        }
        this.terminal();

        return new PrintInst(print, expression, at, open, x, y, close);
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
    private expression = (): IExpr => {
        return this.or();
    }

    // parse or expression
    private or = (): IExpr => {
        return this.binaryExpression(this.and, TokenType.Or);
    }

    // parse and expression
    private and = (): IExpr => {
        return this.binaryExpression(this.equality, TokenType.And)
    }

    // parse equality expression
    private equality = (): IExpr => {
        return this.binaryExpression(this.comparison,
            TokenType.Equal, TokenType.NotEqual);
    }

    // parse comparison expression
    private comparison = (): IExpr => {
        return this.binaryExpression(this.addition,
            TokenType.Less, TokenType.Greater,
            TokenType.LessEqual, TokenType.GreaterEqual);
    }

    // parse addition expression
    private addition = (): IExpr => {
        return this.binaryExpression(this.multiplication,
            TokenType.Plus, TokenType.Minus);
    }

    // parse multiplication expression
    private multiplication = (): IExpr => {
        return this.binaryExpression(this.unary, 
                TokenType.Multi, TokenType.Div);
    }

    // binary expression parser
    private binaryExpression = (recurse: () => IExpr, ...types: TokenType[]): IExpr => {
        let expr = recurse();

        while (this.matchToken(...types)) {
            const operator = this.previous();
            const right = recurse();
            expr = new BinaryExpr(expr, operator, right);
        }

        return expr;
    }

    // parse unary expression
    private unary = (): IExpr => {
        // if unary token found parse as unary
        if (this.matchToken(TokenType.Plus, TokenType.Minus,
                TokenType.Not, TokenType.Defined)) {
            const operator = this.previous();
            const unary = this.unary();
            return new UnaryExpr(operator, unary)
        }

        // else parse plain factor
        return this.factor();
    }

    // parse factor expression
    private factor = (): IExpr => {
        // parse suffix
        let expr = this.suffix();

        // parse seqeunce of factors if they exist
        while (this.matchToken(TokenType.Power)) {
            const power = this.previous();
            const exponenent = this.suffix();
            expr = new FactorExpr(expr, power, exponenent);
        }

        return expr;
    }

    // parse suffix
    private suffix = (): IExpr => {
        let expr = this.suffixTerm();

        // while colons are found parse all trailers
        while (this.matchToken(TokenType.Colon)) {
            expr = this.suffixTrailer(expr);
        }

        return expr;
    }

    // parse suffix trailer expression
    private suffixTrailer = (suffix: Expr): IExpr => {
        const colon = this.previous();
        const trailer = this.suffixTerm();
        return new SuffixExpr(suffix, colon, trailer);
    }

    // parse suffix term expression
    private suffixTerm = (): IExpr => {
        // parse primary
        let expr = this.atom();

        // parse any trailers that exist
        while (true) {
            if (this.matchToken(TokenType.ArrayIndex)) {
                expr = this.arrayIndex(expr);
            } else if (this.matchToken(TokenType.SquareOpen)) {
                expr = this.arrayBracket(expr);
            } else if (this.matchToken(TokenType.BracketOpen)) {
                expr = this.functionTrailer(expr);
            } else if (this.matchToken(TokenType.AtSign)) {
                return new DelegateExpr(expr, this.previous());
            } else {
                break;
            }
        }

        return expr;
    }

    // function call
    private functionTrailer = (callee: Expr): IExpr => {
        const open = this.previous();
        const args = this.arguments();
        if (isArgsError(args)) {
            throw args;
        }

        const close = this.consumeTokenThrow('Expect ")" after arguments.', TokenType.BracketClose);
        
        return new CallExpr(callee, open, args, close);
    }

    // get an argument list
    private arguments = (): IExpr[] => {
        const args: IExpr[] = [];
        if (!this.check(TokenType.BracketClose)) {
            do {
                const arg = this.expression();
                args.push(arg);
            } while(this.matchToken(TokenType.Comma))
        }
        
        return args
    }

    // generate array bracket expression
    private arrayBracket = (array: Expr): IExpr => {
        const open = this.previous();
        const index = this.expression();

        const close = this.consumeTokenThrow('Expected "]" at end of array index.', TokenType.SquareClose)
        return new ArrayBracketExpr(array, open, index, close);
    }

    // generate array index expression
    private arrayIndex = (array: Expr): IExpr => {
        const indexer = this.previous();
     
        // check for integer or identifier
        const index = this.consumeTokenThrow('Expected integer or identifer.', 
            TokenType.Integer, TokenType.Identifier)
        
        return new ArrayIndexExpr(array, indexer, index);
    }

    // parse anonymouse function
    private anonymousFunction = (): IExpr => {
        const open = this.previous();
        const declarations: Inst[] = [];

        // while not at end and until closing curly keep parsing instructions
        while (!this.check(TokenType.CurlyClose) && !this.isAtEnd()) {
            const declaration = this.declaration();

            if (declaration.tag === 'inst') {
                declarations.push(declaration);
            }
        }

        // check closing curly is found
        const close = this.consumeTokenThrow('Expected "}" to finish instruction block', TokenType.CurlyClose);
        return new AnonymousFunctionExpr(open, declarations, close);
    }

    // match atom expressions literals, identifers, list, and parenthesis
    private atom = (): IExpr => {
        // match all literals
        if (this.matchToken(TokenType.False, TokenType.True,
            TokenType.String, TokenType.Integer, TokenType.Double)) {
            return new LiteralExpr(this.previous());
        }

        // match identifiers TODO identifier all keywords that can be used here
        if (isValidIdentifier(this.peek().type) || this.check(TokenType.FileIdentifier)) {
            return new VariableExpr(this.advance());
        }

        // match grouping expression
        if (this.matchToken(TokenType.BracketOpen)) {
            const open = this.previous();
            const expr = this.expression();
            const close = this.consumeTokenThrow('Expect ")" after expression', TokenType.BracketClose);
            
            return new GroupingExpr(open, expr, close);
        }

        // match anonymous function
        if (this.matchToken(TokenType.CurlyOpen)) {
            return this.anonymousFunction()
        }

        // valid expression not found
        throw this.error(this.peek(), 'Expected expression.');
    }

    // check for period
    private terminal = (): TokenResult => {
        return this.consumeTokenThrow('Expected ".".', TokenType.Period);
    }
    
    // check for any valid identifier
    // throws errors if incorrect token is found
    private consumeIdentifierThrow = (message: string): IToken => {
        if (this.matchIdentifier()) return this.previous();
        throw this.error(this.previous(), message);
    }

    // consume current token if it matches type. 
    // throws errors if incorrect token is found
    private consumeTokenThrow = (message: string, ...tokenType: TokenType[]): IToken => {
        if (this.matchToken(...tokenType)) return this.previous();
        throw this.error(this.previous(), message);
    }

    // consume current token if it matches type. 
    // returns errors if incorrect token is found
    private consumeTokenReturn = (message: string, ...tokenType: TokenType[]): IToken | IParseError => {
        if (this.matchToken(...tokenType)) return this.previous();
        return this.error(this.previous(), message);
    }

    // was identifier matched
    private matchIdentifier = (): boolean => {
        const found = this.identifierCheck();
        if (found) this.advance();

        return found;
    }

    // determine if current token matches a set of tokens
    private matchToken = (...types: TokenType[]): boolean => {
        const found = types.some(t => this.check(t));
        if (found) this.advance();

        return found;
    }

    // check if current token can be an identifier
    private identifierCheck = (): boolean => {
        if (this.isAtEnd()) return false;
        return isValidIdentifier(this.peek().type);
    }

    // check if current token matches expected type
    private check = (tokenType: TokenType): boolean => {
        if (this.isAtEnd()) return false;
        return this.peek().type === tokenType;
    }

    // check if the next token matches expected type
    private checkNext = (tokenType: TokenType): boolean => {
        const nextToken = this.peekNext();
        if (empty(nextToken)) return false;
        return nextToken.type === tokenType;
    }

    // return current token and advance
    private advance = (): IToken => {
        if (!this.isAtEnd()) this._current++;
        return this.previous();
    }

    // is parse at the end of file
    private isAtEnd = (): boolean => {
        return this.peek().type === TokenType.Eof;
    }

    // peek current token
    private peek = (): IToken => {
        return this._tokens[this._current];
    }

    // peek next token
    private peekNext = (): Maybe<IToken> => {
        const nextToken = this._tokens[this._current + 1];
        if (empty(nextToken) || nextToken.type === TokenType.Eof) return undefined;
        
        return nextToken;
    }

    // retrieve previous token
    private previous = (): IToken =>{
        return this._tokens[this._current - 1];
    }

    // report parse error
    private error = (token: IToken, message: string, ...extraInfo: string[]): IParseError => {
        return new ParseError(token, message, extraInfo);
    }

    // attempt to synchronize parser
    private synchronize(): void {
        this.advance();
        
        while (!this.isAtEnd()) {
            if (this.previous().type == TokenType.Period) return;

            switch (this.peek().type) {
                case TokenType.Stage:
                case TokenType.Clearscreen:
                case TokenType.Preserve:
                case TokenType.Reboot:
                case TokenType.Shutdown:
                case TokenType.Edit:
                case TokenType.Add:
                case TokenType.Remove:
                case TokenType.Unset:
                case TokenType.Unlock:
                case TokenType.Set:
                case TokenType.If:
                case TokenType.Until:
                case TokenType.From:
                case TokenType.When:
                case TokenType.Return:
                case TokenType.Break:
                case TokenType.Switch:
                case TokenType.For:
                case TokenType.On:
                case TokenType.Toggle:
                case TokenType.Wait:
                case TokenType.Log:
                case TokenType.Copy:
                case TokenType.Rename:
                case TokenType.Delete:
                case TokenType.Run:
                case TokenType.RunPath:
                case TokenType.RunOncePath:
                case TokenType.Compile:
                case TokenType.List:
                case TokenType.Print:
                    return;
                default:
                    break;
            }

            this.advance();
        }
    }
}

const isArgsError = (result: Expr[] | ParseError): result is ParseError => {
    return (<ParseError>result).tag !== undefined;
}