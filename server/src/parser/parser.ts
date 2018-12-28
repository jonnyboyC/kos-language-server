
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
        TokenType.eof, '', undefined,
        new Marker(0, 0),
        new Marker(0, 1),
      );
    }

    const last = tokens[tokens.length - 1];
    return new Token(
      TokenType.eof, '', undefined,
      new Marker(last.end.line + 1, 0),
      new Marker(last.end.line + 1, 1),
    );
  }

  // parse declaration attempt to synchronize
  private declaration = (): IParseResult<IInst> => {
    const start = this.current;
    try {
      if ([TokenType.declare, TokenType.local, TokenType.global,
        TokenType.parameter, TokenType.function, TokenType.lock].some(t => this.check(t))) {
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
    const declare = this.matchToken(TokenType.declare)
      ? this.previous()
      : undefined;

    const scope = this.matchToken(TokenType.local, TokenType.global)
      ? this.previous()
      : undefined;

    const scopeDeclare = declare || scope
      ? new DeclScope(scope, declare)
      : undefined;

    // match declaration
    if (this.matchToken(TokenType.function)) {
      return this.declareFunction(scopeDeclare);
    }
    if (this.matchToken(TokenType.parameter)) {
      return this.declareParameter(scopeDeclare);
    }
    if (this.matchToken(TokenType.lock)) {
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
    if (this.matchToken(TokenType.curlyOpen)) {
      const blockResult = this.instructionBlock();
      this.matchToken(TokenType.period);

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
      if (this.checkNext(TokenType.is) || this.checkNext(TokenType.to)) break;

      const identifer = this.consumeIdentifierThrow(
        'Expected additional identiifer following comma.');

      parameters.push(new Parameter(identifer));
    } while (this.matchToken(TokenType.comma));

    return parameters;
  }

  // parse defaulted parameters
  private declaredDefaultedParameters = (): IParseResult<DefaultParameter[]> => {
    const defaultParameters = [];
    const errors: IParseError[][] = [];

    // parse until no additional parameters exist
    do {
      if (!this.checkNext(TokenType.is) && !this.checkNext(TokenType.to)) break;

      const identifer = this.consumeIdentifierThrow(
        'Expected identifier following comma.');
      const toIs = this.consumeTokenThrow(
        'Expected default parameter using keyword "to" or "is".',
        TokenType.to, TokenType.is);
      const valueResult = this.expression();
      defaultParameters.push(new DefaultParameter(identifer, toIs, valueResult.value));
      errors.push(valueResult.errors);
    } while (this.matchToken(TokenType.comma));

    return parseResult(defaultParameters, ...errors);
  }

  // parse lock instruction
  private declareLock = (scope?: IDeclScope): IParseResult<DeclLock> => {
    const lock = this.previous();
    const identifer = this.consumeIdentifierThrow(
      'Expected identifier following lock keyword.');
    const to = this.consumeTokenThrow(
      'Expected keyword "to" following lock.',
      TokenType.to);
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
      TokenType.to, TokenType.is);
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
      case TokenType.curlyOpen:
        this.advance();
        return this.instructionBlock();
      case TokenType.integer:
      case TokenType.double:
      case TokenType.true:
      case TokenType.false:
      case TokenType.identifier:
      case TokenType.fileIdentifier:
      case TokenType.bracketOpen:
      case TokenType.string:
        // note we don't advance the token index here
        // TODO see if there exists a more general solution
        return this.identifierLedInstruction();
      case TokenType.stage:
      case TokenType.clearscreen:
      case TokenType.preserve:
      case TokenType.reboot:
      case TokenType.shutdown:
        this.advance();
        return this.command();
      case TokenType.edit:
      case TokenType.add:
      case TokenType.remove:
        this.advance();
        return this.commandExpression();
      case TokenType.unset:
        this.advance();
        return this.unset();
      case TokenType.unlock:
        this.advance();
        return this.unlock();
      case TokenType.set:
        this.advance();
        return this.set();
      case TokenType.atSign:
        this.advance();
        return this.lazyGlobal();
      case TokenType.if:
        this.advance();
        return this.ifInst();
      case TokenType.until:
        this.advance();
        return this.until();
      case TokenType.from:
        this.advance();
        return this.from();
      case TokenType.when:
        this.advance();
        return this.when();
      case TokenType.return:
        this.advance();
        return this.returnInst();
      case TokenType.break:
        this.advance();
        return this.breakInst();
      case TokenType.switch:
        this.advance();
        return this.switchInst();
      case TokenType.for:
        this.advance();
        return this.forInst();
      case TokenType.on:
        this.advance();
        return this.on();
      case TokenType.toggle:
        this.advance();
        return this.toggle();
      case TokenType.wait:
        this.advance();
        return this.wait();
      case TokenType.log:
        this.advance();
        return this.log();
      case TokenType.copy:
        this.advance();
        return this.copy();
      case TokenType.rename:
        this.advance();
        return this.rename();
      case TokenType.delete:
        this.advance();
        return this.delete();
      case TokenType.run:
        this.advance();
        return this.run();
      case TokenType.runPath:
        this.advance();
        return this.runPath();
      case TokenType.runOncePath:
        this.advance();
        return this.runPathOnce();
      case TokenType.compile:
        this.advance();
        return this.compile();
      case TokenType.list:
        this.advance();
        return this.list();
      case TokenType.print:
        this.advance();
        return this.print();
      case TokenType.period:
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
    while (!this.check(TokenType.curlyClose) && !this.isAtEnd()) {
      const { value: inst, errors } = this.declaration();
      declarations.push(inst);
      parseErrors = parseErrors.concat(errors);
    }

    // check closing curly is found
    const close = this.consumeTokenReturn(
      'Expected "}" to finish instruction block',
      TokenType.curlyClose);

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

    if (this.matchToken(TokenType.on, TokenType.off)) {
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
      TokenType.identifier, TokenType.all);
    this.terminal();

    return parseResult(new UnsetInst(unset, identifer));
  }

  // parse unlock instruction
  private unlock = (): IParseResult<UnlockInst> => {
    const unlock = this.previous();
    const identifer = this.consumeTokenThrow(
      'Excpeted identifier or "all" following keyword "unlock".',
      TokenType.identifier, TokenType.all);
    this.terminal();

    return parseResult(new UnlockInst(unlock, identifer));
  }

  // parse set instruction
  private set = (): IParseResult<SetInst> => {
    const set = this.previous();
    const suffix = this.suffix();
    const to = this.consumeTokenThrow(
      'Expected "to" following keyword "set".',
      TokenType.to);
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
      TokenType.lazyGlobal);

    const onOff = this.consumeTokenThrow(
      'Expected "on" or "off" following lazy global directive.',
      TokenType.on, TokenType.off);
    this.terminal();

    return parseResult(new LazyGlobalInst(atSign, lazyGlobal, onOff));
  }

  // parse if instruction
  private ifInst = (): IParseResult<IfInst> => {
    const ifToken = this.previous();
    const conditionResult = this.expression();

    const inst = this.declaration();
    this.matchToken(TokenType.period);

    // if else if found parse that branch
    if (this.matchToken(TokenType.else)) {
      const elseToken = this.previous();
      const elseResult = this.declaration();

      const elseInst = new ElseInst(elseToken, elseResult.value);
      this.matchToken(TokenType.period);
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
    this.matchToken(TokenType.period);

    return parseResult(
      new UntilInst(until, conditionResult.value, inst.value),
      conditionResult.errors,
      inst.errors,
    );
  }

  // parse from instruction
  private from = (): IParseResult<FromInst> => {
    const from = this.previous();
    if (this.matchToken(TokenType.curlyOpen)) {
      const initResult = this.instructionBlock();
      const until = this.consumeTokenThrow(
        'Expected "until" expression following from.',
        TokenType.until);
      const conditionResult = this.expression();
      const step = this.consumeTokenThrow(
        'Expected "step" statment following until.',
        TokenType.step);
      if (this.matchToken(TokenType.curlyOpen)) {
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
      TokenType.then);
    const inst = this.declaration();
    this.matchToken(TokenType.period);

    return parseResult(
      new WhenInst(when, conditionResult.value, then, inst.value),
      conditionResult.errors,
      inst.errors,
    );
  }

  // parse return instruction
  private returnInst = (): IParseResult<ReturnInst> => {
    const returnToken = this.previous();
    const valueResult = !this.check(TokenType.period)
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
      'Expected "to" following keyword "switch".', TokenType.to);
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
      TokenType.in);
    const suffix = this.suffix();
    const inst = this.declaration();
    this.matchToken(TokenType.period);

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
    const until = this.matchToken(TokenType.until)
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
      TokenType.to);
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
      TokenType.from, TokenType.to);
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
      TokenType.identifier, TokenType.fileIdentifier);

    const expr = this.expression();
    const to = this.consumeTokenThrow(
      'Expected "to" following keyword "rename".',
      TokenType.to);
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

    if (this.matchToken(TokenType.from)) {
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
    const once = this.matchToken(TokenType.once)
      ? this.previous()
      : undefined;

    const identifier = this.consumeTokenThrow(
      'Expected string or fileidentifier following keyword "run".',
      TokenType.string, TokenType.identifier, TokenType.fileIdentifier);

    let open = undefined;
    let args = undefined;
    let close = undefined;

    // parse arguments if found
    if (this.matchToken(TokenType.bracketOpen)) {
      open = this.previous();
      args = this.arguments();
      close = this.consumeTokenThrow(
        'Expected ")" after "run" arguments.',
        TokenType.bracketClose);
    }

    let on = undefined;
    let expr = undefined;

    // parse arguments if found
    if (this.matchToken(TokenType.on)) {
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
      TokenType.bracketOpen);
    const expr = this.expression();
    const args = this.matchToken(TokenType.comma)
      ? this.arguments()
      : undefined;

    const close = this.consumeTokenThrow(
      'Expected ")" after runPath arguments.',
      TokenType.bracketClose);
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
      TokenType.bracketOpen);
    const expr = this.expression();
    const args = this.matchToken(TokenType.comma)
      ? this.arguments()
      : undefined;

    const close = this.consumeTokenThrow(
      'Expected ")" after runPathOnce arugments.',
      TokenType.bracketClose);
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
    if (this.matchToken(TokenType.to)) {
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
      if (this.matchToken(TokenType.in)) {
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

    if (this.matchToken(TokenType.at)) {
      const at = this.previous();
      const open = this.consumeTokenThrow('Expected "(".', TokenType.bracketOpen);
      const xResult = this.expression();
      this.consumeTokenThrow('Expected ",".', TokenType.comma);
      const yResult = this.expression();
      const close = this.consumeTokenThrow('Expected ")".', TokenType.bracketClose);

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
    return this.binaryExpression(this.and, TokenType.or);
  }

  // parse and expression
  private and = (): IParseResult<IExpr> => {
    return this.binaryExpression(this.equality, TokenType.and);
  }

  // parse equality expression
  private equality = (): IParseResult<IExpr> => {
    return this.binaryExpression(
      this.comparison, TokenType.equal, TokenType.notEqual);
  }

  // parse comparison expression
  private comparison = (): IParseResult<IExpr> => {
    return this.binaryExpression(
      this.addition, TokenType.less, TokenType.greater,
      TokenType.lessEqual, TokenType.greaterEqual);
  }

  // parse addition expression
  private addition = (): IParseResult<IExpr> => {
    return this.binaryExpression(
      this.multiplication, TokenType.plus, TokenType.minus);
  }

  // parse multiplication expression
  private multiplication = (): IParseResult<IExpr> => {
    return this.binaryExpression(
      this.unary, TokenType.multi, TokenType.div);
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
      TokenType.plus, TokenType.minus,
      TokenType.not, TokenType.defined)) {

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
    while (this.matchToken(TokenType.power)) {
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
    while (this.matchToken(TokenType.colon)) {
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
      if (this.matchToken(TokenType.arrayIndex)) {
        const index = this.arrayIndex(expr.value);
        expr = parseResult(index.value, expr.errors, index.errors);
      } else if (this.matchToken(TokenType.squareOpen)) {
        const bracket = this.arrayBracket(expr.value);
        expr = parseResult(bracket.value, expr.errors, bracket.errors);
      } else if (this.matchToken(TokenType.bracketOpen)) {
        const trailer = this.functionTrailer(expr.value);
        expr = parseResult(trailer.value, expr.errors, trailer.errors);
      } else if (this.matchToken(TokenType.atSign)) {
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
    const close = this.consumeTokenThrow('Expect ")" after arguments.', TokenType.bracketClose);

    return parseResult(
      new CallExpr(callee, open, args.value, close),
      args.errors,
    );
  }

  // get an argument list
  private partialArgumentsCount = (): IParseResult<number> => {
    let count = -1;

    if (!this.check(TokenType.bracketClose)) {
      do {
        count += 1;
        if (this.isAtEnd()) break;
        this.expression();
      } while (this.matchToken(TokenType.comma));
    }

    return parseResult(count < 0 ? 0 : count);
  }

  // get an argument list
  private arguments = (): IParseResult<IExpr[]> => {
    const args: IExpr[] = [];
    const errors: IParseError[][] = [];

    if (!this.isAtEnd() && !this.check(TokenType.bracketClose)) {
      do {
        const arg = this.expression();
        args.push(arg.value);
        errors.push(arg.errors);
      } while (this.matchToken(TokenType.comma));
    }

    return parseResult(args, ...errors);
  }

  // generate array bracket expression
  private arrayBracket = (array: Expr): IParseResult<ArrayBracketExpr> => {
    const open = this.previous();
    const index = this.expression();

    const close = this.consumeTokenThrow(
      'Expected "]" at end of array index.', TokenType.squareClose);
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
      TokenType.integer, TokenType.identifier);

    return parseResult(new ArrayIndexExpr(array, indexer, index));
  }

  // parse anonymouse function
  private anonymousFunction = (): IParseResult<AnonymousFunctionExpr> => {
    const open = this.previous();
    const declarations: Inst[] = [];
    let parseErrors: IParseError[] = [];

    // while not at end and until closing curly keep parsing instructions
    while (!this.check(TokenType.curlyClose) && !this.isAtEnd()) {
      const { value: inst, errors } = this.declaration();
      declarations.push(inst);
      parseErrors = parseErrors.concat(errors);
    }

    // check closing curly is found
    const close = this.consumeTokenThrow(
      'Expected "}" to finish instruction block', TokenType.curlyClose);

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
      TokenType.false, TokenType.true,
      TokenType.string, TokenType.integer, TokenType.double)) {
      return parseResult(new LiteralExpr(this.previous()));
    }

    // match identifiers TODO identifier all keywords that can be used here
    if (isValidIdentifier(this.peek().type) || this.check(TokenType.fileIdentifier)) {
      return parseResult(new VariableExpr(this.advance()));
    }

    // match grouping expression
    if (this.matchToken(TokenType.bracketOpen)) {
      const open = this.previous();
      const expr = this.expression();
      const close = this.consumeTokenThrow('Expect ")" after expression', TokenType.bracketClose);

      return parseResult(
        new GroupingExpr(open, expr.value, close),
        expr.errors,
      );
    }

    // match anonymous function
    if (this.matchToken(TokenType.curlyOpen)) {
      return this.anonymousFunction();
    }

    // valid expression not found
    throw this.error(this.peek(), 'Expected expression.');
  }

  // check for period
  private terminal = (): TokenResult => {
    return this.consumeTokenThrow('Expected ".".', TokenType.period);
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
    return this.peek().type === TokenType.eof;
  }

  // peek current token
  private peek = (): IToken => {
    return this.tokens[this.current];
  }

  // peek next token
  private peekNext = (): Maybe<IToken> => {
    const nextToken = this.tokens[this.current + 1];
    if (empty(nextToken) || nextToken.type === TokenType.eof) return undefined;

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
      if (this.previous().type === TokenType.period) return;

      switch (this.peek().type) {
        // declarations
        case TokenType.declare:
        case TokenType.function:
        case TokenType.parameter:
        case TokenType.lock:
        case TokenType.local:
        case TokenType.global:

        // commands
        case TokenType.stage:
        case TokenType.clearscreen:
        case TokenType.preserve:
        case TokenType.reboot:
        case TokenType.shutdown:

        // command expressions
        case TokenType.edit:
        case TokenType.add:
        case TokenType.remove:

        // variable instructions
        case TokenType.unset:
        case TokenType.unlock:
        case TokenType.set:

        // control flow
        case TokenType.if:
        case TokenType.until:
        case TokenType.from:
        case TokenType.when:
        case TokenType.return:
        case TokenType.break:
        case TokenType.switch:
        case TokenType.for:
        case TokenType.on:
        case TokenType.toggle:
        case TokenType.wait:

        // io instructions
        case TokenType.log:
        case TokenType.copy:
        case TokenType.rename:
        case TokenType.delete:
        case TokenType.run:
        case TokenType.runPath:
        case TokenType.runOncePath:
        case TokenType.compile:
        case TokenType.list:
        case TokenType.print:
          return;
        default:
          break;
      }

      this.advance();
    }
  }
}
