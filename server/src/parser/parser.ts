
import { TokenType, isValidIdentifier } from '../entities/tokentypes';
import {
  IParseError, TokenResult,
  IExpr, IDeclScope, IInst, IParseResult,
} from './types';
import { ParseError } from './parserError';
import { Expr, LiteralExpr, GroupingExpr,
  VariableExpr, CallExpr, DelegateExpr,
  ArrayBracketExpr, ArrayIndexExpr,
  FactorExpr, UnaryExpr, BinaryExpr,
  SuffixExpr, AnonymousFunctionExpr, InvalidExpr,
} from './expr';
import { Inst, BlockInst, OnOffInst,
  CommandInst, CommandExpressionInst,
  UnsetInst, UnlockInst, SetInst,
  LazyGlobalInst, ElseInst, IfInst,
  UntilInst, FromInst, WhenInst,
  ReturnInst, SwitchInst, ForInst,
  OnInst, ToggleInst, WaitInst,
  LogInst, CopyInst, RenameInst,
  DeleteInst, RunInst, RunPathInst,
  RunPathOnceInst, CompileInst,
  ListInst, EmptyInst, PrintInst,
  ExprInst, BreakInst, InvalidInst,
} from './inst';
import { DeclScope, DeclFunction,
  DefaultParameter, DeclParameter,
  DeclVariable, DeclLock, Parameter,
} from './declare';
import { empty } from '../utilities/typeGuards';
import { IToken } from '../entities/types';
import { SyntaxTree } from '../entities/syntaxTree';
import { parseResult } from './parseResult';
import { Token, Marker } from '../entities/token';

export class Parser {
  private tokens: IToken[];
  private current: number;

  constructor() {
    this.tokens = [];
    this.current = 0;
  }

  // parse tokens
  public parse = (tokens: IToken[]): [SyntaxTree, IParseError[]]  => {
    this.setTokens(tokens);

    const instructions: Inst[] = [];
    let parseErrors: IParseError[] = [];

    while (!this.isAtEnd()) {
      const { value: inst, errors } = this.declaration();
      instructions.push(inst);
      parseErrors = parseErrors.concat(errors);
    }
    return [
      new SyntaxTree(instructions),
      parseErrors,
    ];
  }

  // testing function / utility
  public parseInstruction = (tokens: IToken[]): IParseResult<IInst> => {
    this.setTokens(tokens);
    return this.declaration();
  }

  // testing function / utility
  public parseExpression = (tokens: IToken[]): IParseResult<IExpr> => {
    this.setTokens(tokens);

    try {
      return this.expression();
    } catch (error) {
      if (error instanceof ParseError) {
        this.synchronize();

        return {
          errors: [error],
          value: new InvalidExpr(this.tokens.slice(0, this.current)),
        };
      }
      throw error;
    }
  }

  public parseArgCount = (tokens: IToken[]): IParseResult<number> => {
    this.setTokens(tokens);
    return this.partialArgumentsCount();
  }

  // set the tokens
  private setTokens = (tokens: IToken[]): void => {
    this.current = 0;
    this.tokens = tokens.concat(this.eof(tokens));
  }

  // generate a placholder token as a fake end of file
  private eof = (tokens: IToken[]): IToken => {
    if (tokens.length === 0) {
      return new Token(
        TokenType.Eof, '', undefined,
        new Marker(0, 0),
        new Marker(0, 1),
      );
    }

    const last = tokens[tokens.length - 1];
    return new Token(
      TokenType.Eof, '', undefined,
      new Marker(last.end.line + 1, 0),
      new Marker(last.end.line + 1, 1),
    );
  }

  // parse declaration attempt to synchronize
  private declaration = (): IParseResult<IInst> => {
    const start = this.current;
    try {
      if ([TokenType.Declare, TokenType.Local, TokenType.Global,
        TokenType.Parameter, TokenType.Function, TokenType.Lock].some(t => this.check(t))) {
        return this.define();
      }

      return this.instruction();
    } catch (error) {
      if (error instanceof ParseError) {
        this.synchronize();

        return {
          errors: [error],
          value: new InvalidInst(this.tokens.slice(start, this.current)),
        };
      }
      throw error;
    }
  }

  // parse declaration instructions
  private define = (): IParseResult<IInst> => {
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

    throw this.error(
      this.peek(),
      'Expected function parameter or variable declaration.',
      'Example: "local function exampleFunc { ...", "global x is 0"');
  }

  // parse function declaration
  private declareFunction = (scope?: IDeclScope): IParseResult<DeclFunction> => {
    const functionToken = this.previous();
    const functionIdentiifer = this.consumeIdentifierThrow('Expected identifier');

    // match function body
    if (this.matchToken(TokenType.CurlyOpen)) {
      const blockResult = this.instructionBlock();
      this.matchToken(TokenType.Period);

      return parseResult(
        new DeclFunction(functionToken, functionIdentiifer, blockResult.value, scope),
        blockResult.errors,
      );
    }

    throw this.error(
      this.peek(),
      'Expected function instruction block starting with "{"',
      'Example: local function { print "hi". }');
  }

  // parse parameter declaration
  private declareParameter = (scope?: IDeclScope): IParseResult<DeclParameter> => {
    const parameterToken = this.previous();

    const parameters = this.declareNormalParameters();
    const defaultParameters = this.declaredDefaultedParameters();
    this.terminal();

    return parseResult(
      new DeclParameter(parameterToken, parameters, defaultParameters.value, scope),
      defaultParameters.errors,
    );
  }

  // parse regular parameters
  private declareNormalParameters = (): Parameter[] => {
    const parameters = [];

    // parse paremter until defaulted
    do {
      // break if this parameter is defaulted
      if (this.checkNext(TokenType.Is) || this.checkNext(TokenType.To)) break;

      const identifer = this.consumeIdentifierThrow(
        'Expected additional identiifer following comma.');

      parameters.push(new Parameter(identifer));
    } while (this.matchToken(TokenType.Comma));

    return parameters;
  }

  // parse defaulted parameters
  private declaredDefaultedParameters = (): IParseResult<DefaultParameter[]> => {
    const defaultParameters = [];
    const errors: IParseError[][] = [];

    // parse until no additional parameters exist
    do {
      if (!this.checkNext(TokenType.Is) && !this.checkNext(TokenType.To)) break;

      const identifer = this.consumeIdentifierThrow(
        'Expected identifier following comma.');
      const toIs = this.consumeTokenThrow(
        'Expected default parameter using keyword "to" or "is".',
        TokenType.To, TokenType.Is);
      const valueResult = this.expression();
      defaultParameters.push(new DefaultParameter(identifer, toIs, valueResult.value));
      errors.push(valueResult.errors);
    } while (this.matchToken(TokenType.Comma));

    return parseResult(defaultParameters, ...errors);
  }

  // parse lock instruction
  private declareLock = (scope?: IDeclScope): IParseResult<DeclLock> => {
    const lock = this.previous();
    const identifer = this.consumeIdentifierThrow(
      'Expected identifier following lock keyword.');
    const to = this.consumeTokenThrow(
      'Expected keyword "to" following lock.',
      TokenType.To);
    const valueResult = this.expression();
    this.terminal();

    return parseResult(
      new DeclLock(lock, identifer, to, valueResult.value, scope),
      valueResult.errors,
    );
  }

  // parse a variable declaration, scoping occurs elseware
  private declareVariable = (scope: IDeclScope): IParseResult<DeclVariable> => {
    const suffix = this.suffix();

    const toIs = this.consumeTokenThrow(
      'Expected keyword "to" or "is" following declar.',
      TokenType.To, TokenType.Is);
    const valueResult = this.expression();
    this.terminal();

    return parseResult(
      new DeclVariable(suffix.value, toIs, valueResult.value, scope),
      suffix.errors,
      valueResult.errors,
    );
  }

  // parse instruction
  private instruction = (): IParseResult<IInst> => {
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
        return this.command();
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
        return parseResult(new EmptyInst(this.advance()));
      default:
        throw this.error(
          this.peek(),
          'Unknown instruction found',
          'Examples: "print "hi"", "LIST.", "RUN "example.ks""');
    }
  }

  // parse a block of instructions
  private instructionBlock = (): IParseResult<BlockInst> => {
    const open = this.previous();
    const declarations: Inst[] = [];

    let parseErrors: IParseError[] = [];

    // while not at end and until closing curly keep parsing instructions
    while (!this.check(TokenType.CurlyClose) && !this.isAtEnd()) {
      const { value: inst, errors } = this.declaration();
      declarations.push(inst);
      parseErrors = parseErrors.concat(errors);
    }

    // check closing curly is found
    const close = this.consumeTokenReturn(
      'Expected "}" to finish instruction block',
      TokenType.CurlyClose);

    // throw and bundle inner error if close not found
    if (close.tag === 'parseError') {
      close.inner = parseErrors;
      throw close;
    }

    return parseResult(new BlockInst(open, declarations, close), parseErrors);
  }

  // parse an instruction lead with a identifier
  private identifierLedInstruction = (): IParseResult<IInst> => {
    const suffix = this.suffix();

    if (this.matchToken(TokenType.On, TokenType.Off)) {
      const onOff = this.onOff(suffix.value);
      return parseResult(onOff.value, suffix.errors, onOff.errors);
    }
    this.terminal();

    return parseResult(
      new ExprInst(suffix.value),
      suffix.errors,
    );
  }

  // parse on off statement
  private onOff = (suffix: IExpr): IParseResult<OnOffInst> => {
    const onOff = this.previous();
    this.terminal();

    return parseResult(new OnOffInst(suffix, onOff));
  }

  // parse command instruction
  private command = (): IParseResult<CommandInst> => {
    const command = this.previous();
    this.terminal();

    return parseResult(new CommandInst(command));
  }

  // parse command instruction
  private commandExpression = (): IParseResult<CommandExpressionInst> => {
    const command = this.previous();
    const expr = this.expression();
    this.terminal();

    return parseResult(
      new CommandExpressionInst(command, expr.value),
      expr.errors,
    );
  }

  // parse unset instruction
  private unset = (): IParseResult<UnsetInst> => {
    const unset = this.previous();
    const identifer = this.consumeTokenThrow(
      'Excpeted identifier or "all" following keyword "unset".',
      TokenType.Identifier, TokenType.All);
    this.terminal();

    return parseResult(new UnsetInst(unset, identifer));
  }

  // parse unlock instruction
  private unlock = (): IParseResult<UnlockInst> => {
    const unlock = this.previous();
    const identifer = this.consumeTokenThrow(
      'Excpeted identifier or "all" following keyword "unlock".',
      TokenType.Identifier, TokenType.All);
    this.terminal();

    return parseResult(new UnlockInst(unlock, identifer));
  }

  // parse set instruction
  private set = (): IParseResult<SetInst> => {
    const set = this.previous();
    const suffix = this.suffix();
    const to = this.consumeTokenThrow(
      'Expected "to" following keyword "set".',
      TokenType.To);
    const valueResult = this.expression();
    this.terminal();

    return parseResult(
      new SetInst(set, suffix.value, to, valueResult.value),
      suffix.errors,
      valueResult.errors,
    );
  }

  // parse lazy global
  private lazyGlobal = (): IParseResult<LazyGlobalInst> => {
    const atSign = this.previous();
    const lazyGlobal = this.consumeTokenThrow(
      'Expected keyword "lazyGlobal" following @.',
      TokenType.LazyGlobal);

    const onOff = this.consumeTokenThrow(
      'Expected "on" or "off" following lazy global directive.',
      TokenType.On, TokenType.Off);
    this.terminal();

    return parseResult(new LazyGlobalInst(atSign, lazyGlobal, onOff));
  }

  // parse if instruction
  private ifInst = (): IParseResult<IfInst> => {
    const ifToken = this.previous();
    const conditionResult = this.expression();

    const inst = this.declaration();
    this.matchToken(TokenType.Period);

    // if else if found parse that branch
    if (this.matchToken(TokenType.Else)) {
      const elseToken = this.previous();
      const elseResult = this.declaration();

      const elseInst = new ElseInst(elseToken, elseResult.value);
      this.matchToken(TokenType.Period);
      return parseResult(
        new IfInst(ifToken, conditionResult.value, inst.value, elseInst),
        conditionResult.errors,
        inst.errors,
        elseResult.errors,
      );
    }

    return parseResult(
      new IfInst(ifToken, conditionResult.value, inst.value),
      inst.errors,
    );
  }

  // parse until instruction
  private until = (): IParseResult<UntilInst> => {
    const until = this.previous();
    const conditionResult = this.expression();
    const inst = this.declaration();
    this.matchToken(TokenType.Period);

    return parseResult(
      new UntilInst(until, conditionResult.value, inst.value),
      conditionResult.errors,
      inst.errors,
    );
  }

  // parse from instruction
  private from = (): IParseResult<FromInst> => {
    const from = this.previous();
    if (this.matchToken(TokenType.CurlyOpen)) {
      const initResult = this.instructionBlock();
      const until = this.consumeTokenThrow(
        'Expected "until" expression following from.',
        TokenType.Until);
      const conditionResult = this.expression();
      const step = this.consumeTokenThrow(
        'Expected "step" statment following until.',
        TokenType.Step);
      if (this.matchToken(TokenType.CurlyOpen)) {
        const incrementResult = this.instructionBlock();
        const doToken = this.consumeTokenThrow(
          'Expected "do" block following step.',
          TokenType.Do);
        const inst = this.declaration();
        return parseResult(
          new FromInst(
            from, initResult.value, until, conditionResult.value,
            step, incrementResult.value, doToken, inst.value,
          ),
          initResult.errors,
          conditionResult.errors,
          incrementResult.errors,
          inst.errors,
        );
      }
      throw this.error(
        this.peek(),
        'Expected "{" followed by step block logic.',
        'Example: FROM {LOCAL x is 0.} UNTIL x >= 10 STEP { set x to x + 1. } { print x. }');
    }
    throw this.error(
      this.peek(),
      'Expected "{" followed by initializer logic',
      'Example: FROM {LOCAL x is 0.} UNTIL x >= 10 STEP { set x to x + 1. } { print x. }');
  }

  // parse when instruction
  private when = (): IParseResult<WhenInst> => {
    const when = this.previous();
    const conditionResult = this.expression();

    const then = this.consumeTokenThrow(
      'Expected "then" following "when" condition.',
      TokenType.Then);
    const inst = this.declaration();
    this.matchToken(TokenType.Period);

    return parseResult(
      new WhenInst(when, conditionResult.value, then, inst.value),
      conditionResult.errors,
      inst.errors,
    );
  }

  // parse return instruction
  private returnInst = (): IParseResult<ReturnInst> => {
    const returnToken = this.previous();
    const valueResult = !this.check(TokenType.Period)
      ? this.expression()
      : undefined;
    this.terminal();

    if (empty(valueResult)) {
      return parseResult(new ReturnInst(returnToken, valueResult));
    }

    return parseResult(
      new ReturnInst(returnToken, valueResult.value),
      valueResult.errors,
    );
  }

  // parse return instruction
  private breakInst = (): IParseResult<BreakInst> => {
    const breakToken = this.previous();
    this.terminal();

    return parseResult(new BreakInst(breakToken));
  }

  // parse switch instruction
  private switchInst = (): IParseResult<SwitchInst> => {
    const switchToken = this.previous();
    const to = this.consumeTokenThrow(
      'Expected "to" following keyword "switch".', TokenType.To);
    const targetResult = this.expression();
    this.terminal();

    return parseResult(
      new SwitchInst(switchToken, to, targetResult.value),
      targetResult.errors,
    );
  }

  // parse for instruction
  private forInst = (): IParseResult<ForInst> => {
    const forToken = this.previous();
    const identifer = this.consumeIdentifierThrow(
      'Expected identifier. following keyword "for"');
    const inToken = this.consumeTokenThrow(
      'Expected "in" after "for" loop variable.',
      TokenType.In);
    const suffix = this.suffix();
    const inst = this.declaration();
    this.matchToken(TokenType.Period);

    return parseResult(
      new ForInst(forToken, identifer, inToken, suffix.value, inst.value),
      suffix.errors,
      inst.errors,
    );
  }

  // parse on instruction
  private on = (): IParseResult<OnInst> => {
    const on = this.previous();
    const suffix = this.suffix();
    const inst = this.declaration();

    return parseResult(
      new OnInst(on, suffix.value, inst.value),
      suffix.errors,
      inst.errors,
    );
  }

  // parse toggle instruction
  private toggle = (): IParseResult<ToggleInst> => {
    const toggle = this.previous();
    const suffix = this.suffix();
    this.terminal();

    return parseResult(
      new ToggleInst(toggle, suffix.value),
      suffix.errors,
    );
  }

  // parse wait instruction
  private wait = (): IParseResult<WaitInst> => {
    const wait = this.previous();
    const until = this.matchToken(TokenType.Until)
      ? this.previous()
      : undefined;

    const expr = this.expression();
    this.terminal();

    return parseResult(
      new WaitInst(wait, expr.value, until),
      expr.errors,
    );
  }

  // parse log instruction
  private log = (): IParseResult<LogInst> => {
    const log = this.previous();
    const expr = this.expression();
    const to = this.consumeTokenThrow(
      'Expected "to" following "log" expression.',
      TokenType.To);
    const targetResult = this.expression();
    this.terminal();

    return parseResult(
      new LogInst(log, expr.value, to, targetResult.value),
      expr.errors,
      targetResult.errors,
    );
  }

  // parse copy instruction
  private copy = (): IParseResult<CopyInst> => {
    const copy = this.previous();
    const expr = this.expression();
    const toFrom = this.consumeTokenThrow(
      'Expected "to" or "from" following "copy" expression.',
      TokenType.From, TokenType.To);
    const targetResult = this.expression();
    this.terminal();

    return parseResult(
      new CopyInst(copy, expr.value, toFrom, targetResult.value),
      expr.errors,
      targetResult.errors,
    );
  }

  // parse rename instruction
  private rename = (): IParseResult<RenameInst> => {
    const rename = this.previous();
    const ioIdentifier = this.consumeTokenThrow(
      'Expected identifier or file identifier following keyword "rename"',
      TokenType.Identifier, TokenType.FileIdentifier);

    const expr = this.expression();
    const to = this.consumeTokenThrow(
      'Expected "to" following keyword "rename".',
      TokenType.To);
    const targetResult = this.expression();
    this.terminal();

    return parseResult(
      new RenameInst(rename, ioIdentifier, expr.value, to, targetResult.value),
      expr.errors,
      targetResult.errors,
    );
  }

  // parse delete instruction
  private delete = (): IParseResult<DeleteInst> => {
    const deleteToken = this.previous();
    const expr = this.expression();

    if (this.matchToken(TokenType.From)) {
      const from = this.previous();
      const targetResult = this.expression();
      this.terminal();

      return parseResult(
        new DeleteInst(deleteToken, expr.value, from, targetResult.value),
        expr.errors,
        targetResult.errors,
      );
    }

    this.terminal();
    return parseResult(
      new DeleteInst(deleteToken, expr.value),
      expr.errors,
    );
  }

  // parse run instruction
  private run = (): IParseResult<RunInst> => {
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
    // handle all the cases
    if (empty(expr)) {
      if (empty(args)) {
        return parseResult(
          new RunInst(run, identifier, once, open, args, close, on, expr),
        );
      }

      return parseResult(
        new RunInst(run, identifier, once, open, args.value, close, on, expr),
        args.errors,
      );
    }

    if (empty(args)) {
      return parseResult(
        new RunInst(run, identifier, once, open, args, close, on, expr.value),
        expr.errors,
      );
    }

    return parseResult(
      new RunInst(run, identifier, once, open, args.value, close, on, expr.value),
      args.errors,
      expr.errors,
    );
  }

  // parse run path instruction
  private runPath = (): IParseResult<RunPathInst> => {
    const runPath = this.previous();
    const open = this.consumeTokenThrow(
      'Expected "(" after keyword "runPath".',
      TokenType.BracketOpen);
    const expr = this.expression();
    const args = this.matchToken(TokenType.Comma)
      ? this.arguments()
      : undefined;

    const close = this.consumeTokenThrow(
      'Expected ")" after runPath arguments.',
      TokenType.BracketClose);
    this.terminal();

    if (empty(args)) {
      return parseResult(
        new RunPathInst(runPath, open, expr.value, close, args),
        expr.errors,
      );
    }

    return parseResult(
      new RunPathInst(runPath, open, expr.value, close, args.value),
      expr.errors,
      args.errors,
    );
  }

  // parse run path once instruction
  private runPathOnce = (): IParseResult<RunPathOnceInst> => {
    const runPath = this.previous();
    const open = this.consumeTokenThrow(
      'Expected "(" after keyword "runPathOnce".',
      TokenType.BracketOpen);
    const expr = this.expression();
    const args = this.matchToken(TokenType.Comma)
      ? this.arguments()
      : undefined;

    const close = this.consumeTokenThrow(
      'Expected ")" after runPathOnce arugments.',
      TokenType.BracketClose);
    this.terminal();

    if (empty(args)) {
      return parseResult(
        new RunPathOnceInst(runPath, open, expr.value, close, args),
        expr.errors,
      );
    }

    return parseResult(
      new RunPathOnceInst(runPath, open, expr.value, close, args.value),
      expr.errors,
      args.errors,
    );
  }

  // parse compile instruction
  private compile = (): IParseResult<CompileInst> => {
    const compile = this.previous();
    const expr = this.expression();
    if (this.matchToken(TokenType.To)) {
      const to = this.previous();
      const targetResult = this.expression();
      this.terminal();

      return parseResult(
        new CompileInst(compile, expr.value, to, targetResult.value),
        expr.errors,
        targetResult.errors,
      );
    }

    this.terminal();
    return parseResult(
      new CompileInst(compile, expr.value),
      expr.errors,
    );
  }

  // parse list instruction
  private list = (): IParseResult<ListInst> => {
    const list = this.previous();
    let identifier = undefined;
    let inToken = undefined;
    let target = undefined;

    if (this.matchIdentifier()) {
      identifier = this.previous();
      if (this.matchToken(TokenType.In)) {
        inToken = this.previous();
        target = this.consumeIdentifierThrow(
          'Expected identifier after "in" keyword in "list" command');
      }
    }
    this.terminal();

    return parseResult(new ListInst(list, identifier, inToken, target));
  }

  // parse print instruction
  private print = (): IParseResult<PrintInst> => {
    const print = this.previous();
    const expr = this.expression();

    if (this.matchToken(TokenType.At)) {
      const at = this.previous();
      const open = this.consumeTokenThrow('Expected "(".', TokenType.BracketOpen);
      const xResult = this.expression();
      this.consumeTokenThrow('Expected ",".', TokenType.Comma);
      const yResult = this.expression();
      const close = this.consumeTokenThrow('Expected ")".', TokenType.BracketClose);

      this.terminal();
      return parseResult(
        new PrintInst(print, expr.value, at, open, xResult.value, yResult.value, close),
        expr.errors,
        xResult.errors,
        yResult.errors,
      );
    }

    this.terminal();
    return parseResult(
      new PrintInst(print, expr.value),
      expr.errors,
    );
  }

  // parse any expression
  private expression = (): IParseResult<IExpr> => {
    return this.or();
  }

  // parse or expression
  private or = (): IParseResult<IExpr> => {
    return this.binaryExpression(this.and, TokenType.Or);
  }

  // parse and expression
  private and = (): IParseResult<IExpr> => {
    return this.binaryExpression(this.equality, TokenType.And);
  }

  // parse equality expression
  private equality = (): IParseResult<IExpr> => {
    return this.binaryExpression(
      this.comparison, TokenType.Equal, TokenType.NotEqual);
  }

  // parse comparison expression
  private comparison = (): IParseResult<IExpr> => {
    return this.binaryExpression(
      this.addition, TokenType.Less, TokenType.Greater,
      TokenType.LessEqual, TokenType.GreaterEqual);
  }

  // parse addition expression
  private addition = (): IParseResult<IExpr> => {
    return this.binaryExpression(
      this.multiplication, TokenType.Plus, TokenType.Minus);
  }

  // parse multiplication expression
  private multiplication = (): IParseResult<IExpr> => {
    return this.binaryExpression(
      this.unary, TokenType.Multi, TokenType.Div);
  }

  // binary expression parser
  private binaryExpression = (recurse: () => IParseResult<IExpr>, ...types: TokenType[]):
    IParseResult<IExpr> => {
    let expr = recurse();

    while (this.matchToken(...types)) {
      const operator = this.previous();
      const right = recurse();
      expr = parseResult(
        new BinaryExpr(expr.value, operator, right.value),
        expr.errors,
        right.errors,
      );
    }

    return expr;
  }

  // parse unary expression
  private unary = (): IParseResult<IExpr> => {
    // if unary token found parse as unary
    if (this.matchToken(
      TokenType.Plus, TokenType.Minus,
      TokenType.Not, TokenType.Defined)) {

      const operator = this.previous();
      const unary = this.unary();
      return parseResult(
        new UnaryExpr(operator, unary.value),
        unary.errors,
      );
    }

    // else parse plain factor
    return this.factor();
  }

  // parse factor expression
  private factor = (): IParseResult<IExpr> => {
    // parse suffix
    let expr = this.suffix();

    // parse seqeunce of factors if they exist
    while (this.matchToken(TokenType.Power)) {
      const power = this.previous();
      const exponenent = this.suffix();
      expr = parseResult(
        new FactorExpr(expr.value, power, exponenent.value),
        exponenent.errors,
      );
    }

    return expr;
  }

  // parse suffix
  private suffix = (): IParseResult<IExpr> => {
    let expr = this.suffixTerm();

    // while colons are found parse all trailers
    while (this.matchToken(TokenType.Colon)) {
      const trailer = this.suffixTrailer(expr.value);
      expr = parseResult(trailer.value, expr.errors, trailer.errors);
    }

    return expr;
  }

  // parse suffix trailer expression
  private suffixTrailer = (suffix: Expr): IParseResult<SuffixExpr> => {
    const colon = this.previous();
    const trailer = this.suffixTerm();
    return parseResult(
      new SuffixExpr(suffix, colon, trailer.value),
      trailer.errors,
    );
  }

  // parse suffix term expression
  private suffixTerm = (): IParseResult<IExpr> => {
    // parse primary
    let expr = this.atom();

    // parse any trailers that exist
    while (true) {
      if (this.matchToken(TokenType.ArrayIndex)) {
        const index = this.arrayIndex(expr.value);
        expr = parseResult(index.value, expr.errors, index.errors);
      } else if (this.matchToken(TokenType.SquareOpen)) {
        const bracket = this.arrayBracket(expr.value);
        expr = parseResult(bracket.value, expr.errors, bracket.errors);
      } else if (this.matchToken(TokenType.BracketOpen)) {
        const trailer = this.functionTrailer(expr.value);
        expr = parseResult(trailer.value, expr.errors, trailer.errors);
      } else if (this.matchToken(TokenType.AtSign)) {
        return parseResult(
          new DelegateExpr(expr.value, this.previous()),
          expr.errors,
        );
      } else {
        break;
      }
    }

    return expr;
  }

  // function call
  private functionTrailer = (callee: Expr): IParseResult<CallExpr> => {
    const open = this.previous();
    const args = this.arguments();
    const close = this.consumeTokenThrow('Expect ")" after arguments.', TokenType.BracketClose);

    return parseResult(
      new CallExpr(callee, open, args.value, close),
      args.errors,
    );
  }

  // get an argument list
  private partialArgumentsCount = (): IParseResult<number> => {
    let count = -1;

    if (!this.check(TokenType.BracketClose)) {
      do {
        count += 1;
        if (this.isAtEnd()) break;
        this.expression();
      } while (this.matchToken(TokenType.Comma));
    }

    return parseResult(count < 0 ? 0 : count);
  }

  // get an argument list
  private arguments = (): IParseResult<IExpr[]> => {
    const args: IExpr[] = [];
    const errors: IParseError[][] = [];

    if (!this.isAtEnd() && !this.check(TokenType.BracketClose)) {
      do {
        const arg = this.expression();
        args.push(arg.value);
        errors.push(arg.errors);
      } while (this.matchToken(TokenType.Comma));
    }

    return parseResult(args, ...errors);
  }

  // generate array bracket expression
  private arrayBracket = (array: Expr): IParseResult<ArrayBracketExpr> => {
    const open = this.previous();
    const index = this.expression();

    const close = this.consumeTokenThrow(
      'Expected "]" at end of array index.', TokenType.SquareClose);
    return parseResult(
      new ArrayBracketExpr(array, open, index.value, close),
      index.errors,
    );
  }

  // generate array index expression
  private arrayIndex = (array: Expr): IParseResult<ArrayIndexExpr> => {
    const indexer = this.previous();

    // check for integer or identifier
    const index = this.consumeTokenThrow(
      'Expected integer or identifer.',
      TokenType.Integer, TokenType.Identifier);

    return parseResult(new ArrayIndexExpr(array, indexer, index));
  }

  // parse anonymouse function
  private anonymousFunction = (): IParseResult<AnonymousFunctionExpr> => {
    const open = this.previous();
    const declarations: Inst[] = [];
    let parseErrors: IParseError[] = [];

    // while not at end and until closing curly keep parsing instructions
    while (!this.check(TokenType.CurlyClose) && !this.isAtEnd()) {
      const { value: inst, errors } = this.declaration();
      declarations.push(inst);
      parseErrors = parseErrors.concat(errors);
    }

    // check closing curly is found
    const close = this.consumeTokenThrow(
      'Expected "}" to finish instruction block', TokenType.CurlyClose);

    // if inner errors found bundle and throw
    if (parseErrors.length > 0) {
      const error = this.error(open, 'Error found in this block.');
      error.inner = parseErrors;
      throw error;
    }
    return parseResult(
      new AnonymousFunctionExpr(open, declarations, close),
      parseErrors,
    );
  }

  // match atom expressions literals, identifers, list, and parenthesis
  private atom = (): IParseResult<IExpr> => {
    // match all literals
    if (this.matchToken(
      TokenType.False, TokenType.True,
      TokenType.String, TokenType.Integer, TokenType.Double)) {
      return parseResult(new LiteralExpr(this.previous()));
    }

    // match identifiers TODO identifier all keywords that can be used here
    if (isValidIdentifier(this.peek().type) || this.check(TokenType.FileIdentifier)) {
      return parseResult(new VariableExpr(this.advance()));
    }

    // match grouping expression
    if (this.matchToken(TokenType.BracketOpen)) {
      const open = this.previous();
      const expr = this.expression();
      const close = this.consumeTokenThrow('Expect ")" after expression', TokenType.BracketClose);

      return parseResult(
        new GroupingExpr(open, expr.value, close),
        expr.errors,
      );
    }

    // match anonymous function
    if (this.matchToken(TokenType.CurlyOpen)) {
      return this.anonymousFunction();
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
  private consumeTokenReturn = (message: string, ...tokenType: TokenType[])
    : IToken | IParseError => {
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
    if (!this.isAtEnd()) {
      this.current += 1;
    }
    return this.previous();
  }

  // is parse at the end of file
  private isAtEnd = (): boolean => {
    return this.peek().type === TokenType.Eof;
  }

  // peek current token
  private peek = (): IToken => {
    return this.tokens[this.current];
  }

  // peek next token
  private peekNext = (): Maybe<IToken> => {
    const nextToken = this.tokens[this.current + 1];
    if (empty(nextToken) || nextToken.type === TokenType.Eof) return undefined;

    return nextToken;
  }

  // retrieve previous token
  private previous = (): IToken => {
    return this.tokens[this.current - 1];
  }

  // report parse error
  private error = (token: IToken, message: string, ...extraInfo: string[]): IParseError => {
    return new ParseError(token, message, extraInfo);
  }

  // attempt to synchronize parser
  private synchronize(): void {
    // need to confirm this is the only case
    this.advance();
    // if (this.peek().type === TokenType.CurlyClose) {
    // }

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.Period) return;

      switch (this.peek().type) {
        // declarations
        case TokenType.Declare:
        case TokenType.Function:
        case TokenType.Parameter:
        case TokenType.Lock:
        case TokenType.Local:
        case TokenType.Global:

        // commands
        case TokenType.Stage:
        case TokenType.Clearscreen:
        case TokenType.Preserve:
        case TokenType.Reboot:
        case TokenType.Shutdown:

        // command expressions
        case TokenType.Edit:
        case TokenType.Add:
        case TokenType.Remove:

        // variable instructions
        case TokenType.Unset:
        case TokenType.Unlock:
        case TokenType.Set:

        // control flow
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

        // io instructions
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
