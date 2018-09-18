import { TokenInterface } from '../scanner/types';
import { TokenType, isValidIdentifier } from '../scanner/tokentypes';
import { ParseErrorInterface, ExprResult, TokenResult, InstResult, ExprInterface, ScopeInterface, InstInterface } from './types';
import { ParseError } from './parserError';
import { Expr, ExprLiteral, ExprGrouping, ExprVariable, ExprCall, ExprDelegate, ExprArrayBracket, ExprArrayIndex, ExprFactor, ExprUnary, ExprBinary, ExprSuffix, ExprAnonymousFunction } from './expr';
import { Inst, InstructionBlock, OnOffInst, CommandInst, CommandExpressionInst, UnsetInst, UnlockInst, SetInst, LazyGlobalInst, ElseInst, IfInst, UntilInst, FromInst, WhenInst, ReturnInst, SwitchInst, ForInst, OnInst, ToggleInst, WaitInst, LogInst, CopyInst, RenameInst, DeleteInst, RunInst, RunPathInst, RunPathOnceInst, CompileInst, ListInst, EmptyInst, PrintInst, ExprInst, BreakInst } from './inst';
import { Scope, FunctionDeclartion, DefaultParameter, ParameterDeclaration, VariableDeclaration, LockDeclaration } from './declare';

export class Parser {
    private readonly _tokens: TokenInterface[]
    private _current: number;

    constructor(tokens: TokenInterface[]) {
        this._tokens = tokens;
        this._current = 0;
    }

    // parse tokens
    public parse(): [Inst[], ParseErrorInterface[]] {
        const instructions: Inst[] = [];
        const errors: ParseErrorInterface[] = [];
        
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
        return [instructions, errors];
    }

    // parse declaration attempt to synchronize
    private declaration = (): InstResult => {
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
    private define = (): InstInterface => {
        // attempt to find scoping
        const declare = this.match(TokenType.Declare)
            ? this.previous()
            : undefined;

        const scope = this.match(TokenType.Local, TokenType.Global)
            ? this.previous()
            : undefined;

        const scopeDeclare = declare || scope
            ? new Scope(scope, declare)
            : undefined;

        // match declaration
        if (this.match(TokenType.Function)) {
            return this.declareFunction(scopeDeclare);
        }
        if (this.match(TokenType.Parameter)) {
            return this.declareParameter(scopeDeclare);
        }
        if (this.match(TokenType.Lock)) {
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
    private declareFunction = (scope?: ScopeInterface): InstInterface => {
        const functionToken = this.previous();
        const functionIdentiifer = this.consumeValidIdentifier("Expected identifier");

        // match function body
        if (this.match(TokenType.CurlyOpen)) {
            const instructionBlock = this.instructionBlock();
            return new FunctionDeclartion(functionToken, functionIdentiifer, instructionBlock, scope);
        }

        throw this.error(this.peek(), 
            'Expected function instruction block starting with "{"',
            'Example: local function { print "hi". }')
    }

    // parse parameter declaration
    private declareParameter = (scope?: ScopeInterface): InstInterface => {
        const parameterToken = this.previous();
        let identifer = this.consumeValidIdentifier(
            'Expected identifier after parameter keyword.');
        const parameters = [identifer];
        const defaultParameters = [];

        // if comma found more parameters can be parsed
        while (this.match(TokenType.Comma)) {
            identifer = this.consumeValidIdentifier(
                'Expected additional identiifer following comma.');
            
            // if is or to found defaulted parameters proceed
            if (this.check(TokenType.Is) || this.check(TokenType.To)) break;
            parameters.push(identifer);
        }

        // check if default parameter
        if (this.match(TokenType.Is) || this.match(TokenType.To)) {
            let toIs = this.previous();
            let value = this.expression();
            defaultParameters.push(new DefaultParameter(identifer, toIs, value));

            // from here on check only for defaulted parameters
            while (this.match(TokenType.Comma)) {
                identifer = this.consumeValidIdentifier(
                    'Expected identifier following comma.');
                toIs = this.consume(
                    'Expected default parameter using keyword "to" or "is".',
                    TokenType.To, TokenType.Is);
                value = this.expression();
                defaultParameters.push(new DefaultParameter(identifer, toIs, value));
            } 
        }

        return new ParameterDeclaration(parameterToken, parameters, defaultParameters, scope);
    }

    // parse lock instruction
    private declareLock = (scope?: ScopeInterface): InstInterface => {
        const lock = this.previous();
        const identifer = this.consumeValidIdentifier(
            'Expected identifier following lock keyword.');
        const to = this.consume(
            'Expected keyword "to" following lock.', 
            TokenType.To);
        const value = this.expression();

        return new LockDeclaration(lock, identifer, to, value, scope);
    }

    // parse a variable declaration, scoping occurs elseware
    private declareVariable = (scope: ScopeInterface): InstInterface => {
        const suffix = this.suffix();

        const toIs = this.consume(
            'Expected keyword "to" or "is" following declar.', 
            TokenType.To, TokenType.Is);
        const value = this.expression();
        this.terminal();

        return new VariableDeclaration(suffix, toIs, value, scope);
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
    public instruction = (): InstInterface => {
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
    private instructionBlock = (): InstInterface => {
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
        const close = this.consume(
            'Expected "}" to finish instruction block', 
            TokenType.CurlyClose);
        return new InstructionBlock(open, declarations, close);
    }

    // parse an instruction lead with a identifier
    private identifierLedInstruction = (): InstInterface => {
        const suffix = this.suffix();

        if (this.match(TokenType.On, TokenType.Off)) {
            return this.onOff(suffix);
        }
        this.terminal();

        return new ExprInst(suffix);
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
        this.terminal();

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
        const identifer = this.consume(
            'Excpeted identifier or "all" following keyword "unset".', 
            TokenType.Identifier, TokenType.All);

        return new UnsetInst(unset, identifer);
    }

    // parse unlock instruction
    private unlock = (): InstInterface => {
        const unlock = this.previous();
        const identifer = this.consume(
            'Excpeted identifier or "all" following keyword "unlock".', 
            TokenType.Identifier, TokenType.All);

        return new UnlockInst(unlock, identifer);
    }

    // parse set instruction
    private set = (): InstInterface => {
        const set = this.previous();
        const suffix = this.suffix();
        const to = this.consume(
            'Expected "to" following keyword "set".', 
            TokenType.To);
        const value = this.expression();

        return new SetInst(set, suffix, to, value);
    }

    // parse lazy global
    private lazyGlobal = (): InstInterface => {
        const atSign = this.previous();
        const lazyGlobal = this.consume(
            'Expected keyword "lazyGlobal" following @.', 
            TokenType.LazyGlobal);

        const onOff = this.consume(
            'Expected "on" or "off" following lazy global directive.', 
            TokenType.On, TokenType.Off);
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
        if (this.match(TokenType.CurlyOpen)) {
            const initializer = this.instructionBlock();
            const until = this.consume(
                'Expected "until" expression following from.', 
                TokenType.Until);
            const condition = this.expression();
            const step = this.consume(
                'Expected "step" statment following until.', 
                TokenType.Step);
            if (this.match(TokenType.CurlyOpen)) {
                const increment = this.instructionBlock();
                const doToken = this.consume(
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
    private when = (): InstInterface => {
        const when = this.previous();
        const condition = this.expression();

        const then = this.consume(
            'Expected "then" following "when" condition.', 
            TokenType.Then);
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

    // parse return instruction
    private breakInst = (): InstInterface => {
        const breakToken = this.previous();
        this.terminal();

        return new BreakInst(breakToken);
    }

    // parse switch instruction
    private switchInst = (): InstInterface => {
        const switchToken = this.previous();
        const to = this.consume(
            'Expected "to" following keyword "switch".', TokenType.To);
        const target = this.expression();
        this.terminal();

        return new SwitchInst(switchToken, to, target);
    }

    // parse for instruction
    private forInst = (): InstInterface => {
        const forToken = this.previous();
        const identifer = this.consumeValidIdentifier(
            'Expected identifier. following keyword "for"');
        const inToken = this.consume(
            'Expected "in" after "for" loop variable.', 
            TokenType.In);
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
        const to = this.consume(
            'Expected "to" following "log" expression.', 
            TokenType.To);
        const target = this.expression();
        this.terminal();

        return new LogInst(log, expression, to, target);
    }

    // parse copy instruction
    private copy = (): InstInterface => {
        const copy = this.previous();
        const expression = this.expression();
        const toFrom = this.consume(
            'Expected "to" or "from" following "copy" expression.', 
            TokenType.From, TokenType.To);
        const target = this.expression();
        this.terminal();
        
        return new CopyInst(copy, expression, toFrom, target);
    }

    // parse rename instruction
    private rename = (): InstInterface => {
        const rename = this.previous();
        const ioIdentifier = this.consume(
            'Expected identifier or file identifier following keyword "rename"',
            TokenType.Identifier, TokenType.FileIdentifier);

        const expression = this.expression();
        const to = this.consume(
            'Expected "to" following keyword "rename".', 
            TokenType.To);
        const target = this.expression();
        this.terminal();

        return new RenameInst(rename, ioIdentifier, expression, to, target);
    }

    // parse delete instruction
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

    // parse run instruction
    private run = (): InstInterface => {
        const run = this.previous();
        const once = this.match(TokenType.Once)
            ? this.previous()
            : undefined;
        
        const identifier = this.consume(
            'Expected string or fileidentifier following keyword "run".',
            TokenType.String, TokenType.Identifier, TokenType.FileIdentifier);
        
        let open = undefined;
        let args = undefined;
        let close = undefined;

        // parse arguments if found
        if (this.match(TokenType.BracketOpen)) {
            open = this.previous();
            args = this.arguments();
            close = this.consume(
                'Expected ")" after "run" arguments.', 
                TokenType.BracketClose);
        }

        let on = undefined;
        let expr = undefined;

        // parse arguments if found
        if (this.match(TokenType.On)) {
            on = this.previous();
            args = this.arguments();
            expr = this.expression();
        }

        this.terminal();
        return new RunInst(run, identifier, once, open, args, close, on, expr);
    }

    // parse run path instruction
    private runPath = (): InstInterface => {
        const runPath = this.previous();
        const open = this.consume(
            'Expected "(" after keyword "runPath".', 
            TokenType.BracketOpen);
        const expression = this.expression();
        const args = this.match(TokenType.Comma)
            ? this.arguments()
            : undefined;

        const close = this.consume(
            'Expected ")" after runPath arguments.', 
            TokenType.BracketClose);
        this.terminal();

        return new RunPathInst(runPath, open, expression, close, args);
    }

    // parse run path once instruction
    private runPathOnce = (): InstInterface => {
        const runPath = this.previous();
        const open = this.consume(
            'Expected "(" after keyword "runPathOnce".', 
            TokenType.BracketOpen);
        const expression = this.expression();
        const args = this.match(TokenType.Comma)
            ? this.arguments()
            : undefined;

        const close = this.consume(
            'Expected ")" after runPathOnce arugments.', 
            TokenType.BracketClose);
        this.terminal();

        return new RunPathOnceInst(runPath, open, expression, close, args);
    }

    // parse compile instruction
    private compile = (): InstInterface => {
        const compile = this.previous();
        const expression = this.expression();
        if (this.match(TokenType.To)) {
            const to = this.previous();
            const target = this.expression();
            this.terminal();
        
            return new CompileInst(compile, expression, to, target);
        }

        this.terminal();
        return new CompileInst(compile, expression);
    }

    // parse list instruction
    private list = (): InstInterface => {
        const list = this.previous();
        let identifier = undefined;
        let inToken = undefined;
        let target = undefined;

        if (this.identifierMatch()) {
            identifier = this.previous();
            if (this.match(TokenType.In)) {
                inToken = this.previous();
                target = this.consumeValidIdentifier('Expected identifier after "in" keyword in "list" command');
            }
        }
        this.terminal();
        
        return new ListInst(list, identifier, inToken, target);
    }

    // parse print instruction
    private print = (): InstInterface => {
        const print = this.previous();
        const expression = this.expression();
        let at = undefined;
        let open = undefined;
        let x = undefined;
        let y = undefined;
        let close = undefined;

        if (this.match(TokenType.At)) {
            at = this.previous();
            open = this.consume('Expected "(".', TokenType.BracketOpen);
            x = this.expression();
            this.consume('Expected ",".', TokenType.Comma);
            y = this.expression();
            close = this.consume('Expected ")".', TokenType.BracketClose);
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
        let expr = this.atom();

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
        if (isArgsError(args)) {
            throw args;
        }

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

        const close = this.consume('Expected "]" at end of array index.', TokenType.SquareClose)
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

    // parse anonymouse function
    private anonymousFunction = (): ExprInterface => {
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
        const close = this.consume('Expected "}" to finish instruction block', TokenType.CurlyClose);
        return new ExprAnonymousFunction(open, declarations, close);
    }

    // match atom expressions literals, identifers, list, and parenthesis
    private atom = (): ExprInterface => {
        // match all literals
        if (this.match(TokenType.False, TokenType.True,
            TokenType.String, TokenType.Integer, TokenType.Double)) {
            return new ExprLiteral(this.previous());
        }

        // match identifiers TODO identifier all keywords that can be used here
        if (isValidIdentifier(this.peek().type) || this.check(TokenType.FileIdentifier)) {
            return new ExprVariable(this.advance());
        }

        // match grouping expression
        if (this.match(TokenType.BracketOpen)) {
            const open = this.previous();
            const expr = this.expression();
            const close = this.consume('Expect ")" after expression', TokenType.BracketClose);
            
            return new ExprGrouping(open, expr, close);
        }

        // match anonymous function
        if (this.match(TokenType.CurlyOpen)) {
            return this.anonymousFunction()
        }

        // valid expression not found
        throw this.error(this.peek(), 'Expected expression.');
    }

    // check for period
    private terminal = (): TokenResult => {
        return this.consume('Expected ".".', TokenType.Period);
    }
    
    // check for any valid identifier
    private consumeValidIdentifier = (message: string): TokenInterface => {
        if (this.identifierMatch()) return this.previous();
        throw this.error(this.previous(), message);
    }

    // consume current token if it matches type. 
    // returns erros if incorrect token is found
    private consume = (message: string, ...tokenType: TokenType[]): TokenInterface => {
        if (this.match(...tokenType)) return this.previous();
        throw this.error(this.previous(), message);
    }

    // was identifier matched
    private identifierMatch = (): boolean => {
        const found = this.identifierCheck();
        if (found) this.advance();

        return found;
    }

    // determine if current token matches a set of tokens
    private match = (...types: TokenType[]): boolean => {
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
    private error = (token: TokenInterface, message: string, ...extraInfo: string[]): ParseErrorInterface => {
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
                case TokenType.Period:
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