import { TokenType, isValidIdentifier } from '../entities/tokentypes';
import {
  IParseError,
  IExpr,
  IStmt,
  INodeResult,
  RunStmtType,
  Ast,
  Atom,
  SuffixTermTrailer,
  PartialNode,
  NodeDataBuilder,
} from './types';
import {
  ParseError,
  FailedConstructor,
  failedUnknown,
  failedExpr,
  failedStmt,
} from './parserError';
import * as Expr from './expr';
import * as SuffixTerm from './suffixTerm';
import * as Stmt from './stmt';
import * as Decl from './declare';
import { empty } from '../utilities/typeGuards';
import { Script } from '../entities/script';
import { nodeResult } from './parseResult';
import { Token } from '../entities/token';
import { mockLogger, mockTracer, logException } from '../utilities/logger';
import { flatten } from '../utilities/arrayUtils';
import { Marker } from '../entities/marker';
import { Diagnostic } from 'vscode-languageserver';
import { parseToDiagnostics } from '../utilities/serverUtils';

type NodeConstructor =
  | Constructor<Expr.Expr>
  | Constructor<Stmt.Stmt>
  | Constructor;

export class Parser {
  private uri: string;
  private tokens: Token[];
  private current: number;
  private runStmts: RunStmtType[];

  private readonly andBind = this.and.bind(this);
  private readonly eqaulityBind = this.equality.bind(this);
  private readonly comparisonBind = this.comparison.bind(this);
  private readonly additionBind = this.addition.bind(this);
  private readonly multiplicationBind = this.multiplication.bind(this);
  private readonly unaryBind = this.unary.bind(this);
  private readonly logger: ILogger;
  private readonly tracer: ITracer;

  constructor(
    uri: string,
    tokens: Token[],
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer,
  ) {
    this.uri = uri;
    this.tokens = tokens.concat(this.eof(tokens));
    this.current = 0;
    this.runStmts = [];
    this.logger = logger;
    this.tracer = tracer;
  }

  // parse tokens
  public parse(): Ast {
    try {
      const splits = this.uri.split('/');
      const file = splits[splits.length - 1];

      this.logger.info(
        `Parsing started for ${file} with ${this.tokens.length} tokens.`,
      );

      const statements: Stmt.Stmt[] = [];
      const parseDiagnostics: Diagnostic[] = [];

      while (!this.isAtEnd()) {
        const { value, errors } = this.declaration();
        const diagnostics =
          errors.length === 0
            ? []
            : errors
                .map(error => error.inner.concat(error))
                .reduce((acc, current) => acc.concat(current))
                .map(error => parseToDiagnostics(error));

        statements.push(value);
        parseDiagnostics.push(...diagnostics);
      }

      this.logger.info(
        `Parsing finished for ${file} with ` +
          `${this.runStmts.length} run statements`,
      );
      if (parseDiagnostics.length > 0) {
        this.logger.warn(
          `Parser encountered ${parseDiagnostics.length} errors`,
        );
      }

      return {
        parseDiagnostics,
        script: new Script(this.uri, statements, this.runStmts),
      };
    } catch (err) {
      this.logger.error('Error occurred in parser');
      logException(this.logger, this.tracer, err, LogLevel.error);

      return {
        parseDiagnostics: [],
        script: new Script(this.uri, [], []),
      };
    }
  }

  // testing function / utility
  public parseStatement(): INodeResult<IStmt> {
    return this.declaration();
  }

  // testing function / utility
  public parseExpression(): INodeResult<IExpr> {
    try {
      return this.expression();
    } catch (error) {
      if (error instanceof ParseError) {
        this.synchronize(error.failed);

        return {
          errors: [error],
          value: new Expr.Invalid(
            this.tokens[0].start,
            this.tokens.slice(0, this.current),
          ),
        };
      }
      throw error;
    }
  }

  // generate a place holder token as a fake end of file
  private eof(tokens: Token[]): Token {
    if (tokens.length === 0) {
      return new Token(
        TokenType.eof,
        '',
        undefined,
        new Marker(0, 0),
        new Marker(0, 1),
        '',
      );
    }

    const last = tokens[tokens.length - 1];
    return new Token(
      TokenType.eof,
      '',
      undefined,
      new Marker(last.end.line + 1, 0),
      new Marker(last.end.line + 1, 1),
      last.uri,
    );
  }

  // parse declaration attempt to synchronize
  private declaration(): INodeResult<IStmt> {
    const start = this.current;
    try {
      if (
        [
          TokenType.declare,
          TokenType.local,
          TokenType.global,
          TokenType.parameter,
          TokenType.function,
          TokenType.lock,
        ].some(t => this.check(t))
      ) {
        return this.define();
      }

      return this.statement();
    } catch (error) {
      if (error instanceof ParseError) {
        this.logger.verbose(JSON.stringify(error.partial));
        this.synchronize(error.failed);

        const tokens = this.tokens.slice(start, this.current);

        return {
          errors: [error],
          value: new Stmt.Invalid(
            start === this.current ? this.peek().end : tokens[0].start,
            tokens,
            error.partial,
          ),
        };
      }
      throw error;
    }
  }

  // parse declaration statements
  private define(): INodeResult<IStmt> {
    // attempt to find scoping
    const declare = this.matchToken(TokenType.declare)
      ? this.previous()
      : undefined;

    const scope = this.matchTokens([TokenType.local, TokenType.global])
      ? this.previous()
      : undefined;

    const scopeDeclare =
      declare || scope ? new Decl.Scope(scope, declare) : undefined;

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
    if (!empty(scopeDeclare)) {
      return this.declareVariable(scopeDeclare);
    }

    throw this.error(
      this.peek(),
      Decl.Scope,
      'Expected function parameter or variable declaration.',
      'Example: "local function exampleFunc { ... }", "global x is 0"',
    );
  }

  // parse function declaration
  private declareFunction(scope?: Decl.Scope): INodeResult<Decl.Func> {
    const builder: NodeDataBuilder<Decl.Func> = {
      scope,
      functionToken: undefined,
      identifier: undefined,
      block: undefined,
    };

    builder.functionToken = this.previous();
    builder.identifier = this.consumeIdentifierThrow(
      'Expected identifier',
      Decl.Func,
      builder,
    );

    // match function body
    if (this.matchToken(TokenType.curlyOpen)) {
      const block = this.block();
      builder.block = block.value;

      this.matchToken(TokenType.period);
      return nodeResult(new Decl.Func(builder), block.errors);
    }

    throw this.error(
      this.peek(),
      Decl.Func,
      'Expected function statement block starting with "{"',
      'Example: local function { print "hi". }',
      builder,
    );
  }

  // parse parameter declaration
  private declareParameter(scope?: Decl.Scope): INodeResult<Decl.Param> {
    const builder: NodeDataBuilder<Decl.Param> = {
      scope,
      parameterToken: undefined,
      requiredParameters: undefined,
      optionalParameters: undefined,
    };

    builder.parameterToken = this.previous();

    builder.requiredParameters = this.declareNormalParameters();
    const defaultParameters = this.declaredDefaultedParameters();
    builder.optionalParameters = defaultParameters.value;

    this.terminal(Decl.Param);
    return nodeResult(new Decl.Param(builder), defaultParameters.errors);
  }

  // parse regular parameters
  private declareNormalParameters(): Decl.Parameter[] {
    const parameters = [];

    // parse paremter until defaulted
    do {
      // break if this parameter is defaulted
      if (this.checkNext(TokenType.is) || this.checkNext(TokenType.to)) break;

      const identifer = this.consumeIdentifierThrow(
        'Expected additional identiifer following comma.',
        Decl.Parameter,
      );

      parameters.push(new Decl.Parameter(identifer));
    } while (this.matchToken(TokenType.comma));

    return parameters;
  }

  // parse defaulted parameters
  private declaredDefaultedParameters(): INodeResult<Decl.DefaultParam[]> {
    const defaultParameters = [];
    const errors: IParseError[][] = [];

    // parse until no additional parameters exist
    do {
      if (!this.checkNext(TokenType.is) && !this.checkNext(TokenType.to)) break;

      const identifer = this.consumeIdentifierThrow(
        'Expected identifier following comma.',
        Decl.DefaultParam,
      );
      const toIs = this.consumeTokensThrow(
        'Expected default parameter using keyword "to" or "is".',
        Decl.DefaultParam,
        [TokenType.to, TokenType.is],
      );
      const valueResult = this.expression();
      defaultParameters.push(
        new Decl.DefaultParam(identifer, toIs, valueResult.value),
      );
      errors.push(valueResult.errors);
    } while (this.matchToken(TokenType.comma));

    return nodeResult(defaultParameters, flatten(errors));
  }

  // parse lock statement
  private declareLock(scope?: Decl.Scope): INodeResult<Decl.Lock> {
    const builder: NodeDataBuilder<Decl.Lock> = {
      scope,
      lock: undefined,
      identifier: undefined,
      value: undefined,
      to: undefined,
    };

    builder.lock = this.previous();
    builder.identifier = this.consumeIdentifierThrow(
      'Expected identifier following lock keyword.',
      Decl.Lock,
      builder,
    );
    builder.to = this.consumeTokenThrow(
      'Expected keyword "to" following lock.',
      Decl.Lock,
      TokenType.to,
      builder,
    );
    const valueResult = this.expression();
    builder.value = valueResult.value;

    this.terminal(Decl.Lock, builder);
    return nodeResult(new Decl.Lock(builder), valueResult.errors);
  }

  // parse a variable declaration, scoping occurs elsewhere
  private declareVariable(scope: Decl.Scope): INodeResult<Decl.Var> {
    const builder: NodeDataBuilder<Decl.Var> = {
      scope,
      identifier: undefined,
      value: undefined,
      toIs: undefined,
    };

    builder.identifier = this.consumeIdentifierThrow(
      'Expected identifier.',
      Decl.Var,
      builder,
    );

    builder.toIs = this.consumeTokensThrow(
      'Expected keyword "to" or "is" following declare.',
      Decl.Var,
      [TokenType.to, TokenType.is],
      builder,
    );
    const valueResult = this.expression();
    builder.value = valueResult.value;

    this.terminal(Decl.Var, builder);
    return nodeResult(new Decl.Var(builder), valueResult.errors);
  }

  // parse statement
  private statement(): INodeResult<IStmt> {
    switch (this.peek().type) {
      case TokenType.curlyOpen:
        this.advance();
        return this.block();
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
        return this.identifierLedStatement();
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
        return this.ifStmt();
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
        return this.returnStmt();
      case TokenType.break:
        this.advance();
        return this.breakStmt();
      case TokenType.switch:
        this.advance();
        return this.switchStmt();
      case TokenType.for:
        this.advance();
        return this.forStmt();
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
        return this.runOncePath();
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
        return nodeResult(new Stmt.Empty(this.advance()), []);
      default:
        throw this.error(
          this.peek(),
          undefined,
          'Unknown statement found',
          'Examples: "print "hi"", "LIST.", "RUN "example.ks""',
        );
    }
  }

  // parse a block of statements
  private block(): INodeResult<Stmt.Block> {
    const builder: NodeDataBuilder<Stmt.Block> = {
      open: undefined,
      stmts: undefined,
      close: undefined,
    };

    builder.open = this.previous();
    const declarations: Stmt.Stmt[] = [];

    const parseErrors: IParseError[] = [];

    // while not at end and until closing curly keep parsing statements
    while (!this.check(TokenType.curlyClose) && !this.isAtEnd()) {
      const { value, errors } = this.declaration();
      declarations.push(value);
      parseErrors.push(...errors);
    }
    builder.stmts = declarations;

    // check closing curly is found
    const close = this.consumeTokenReturn(
      'Expected "}" to finish statement block',
      Stmt.Block,
      [TokenType.curlyClose],
    );

    // throw and bundle inner error if close not found
    if (close.tag === 'parseError') {
      close.inner = parseErrors;
      throw close;
    }

    builder.close = close;
    return nodeResult(new Stmt.Block(builder), parseErrors);
  }

  // parse an statement lead with a identifier
  private identifierLedStatement(): INodeResult<IStmt> {
    const builder: NodeDataBuilder<Stmt.ExprStmt> = {
      suffix: undefined,
    };

    const suffix = this.suffixCatch(Stmt.ExprStmt, builder, 'suffix');
    builder.suffix = suffix.value;

    if (this.matchTokens([TokenType.on, TokenType.off])) {
      const onOff = this.onOff(suffix.value);
      return nodeResult(onOff.value, flatten([suffix.errors, onOff.errors]));
    }
    this.terminal(Stmt.ExprStmt, builder);

    return nodeResult(new Stmt.ExprStmt(suffix.value), suffix.errors);
  }

  // parse on off statement
  private onOff(suffix: Expr.Suffix): INodeResult<Stmt.OnOff> {
    const builder: NodeDataBuilder<Stmt.OnOff> = {
      suffix,
      onOff: this.previous(),
    };

    this.terminal(Stmt.OnOff, builder);
    return nodeResult(new Stmt.OnOff(builder), []);
  }

  // parse command statement
  private command(): INodeResult<IStmt> {
    const command = this.previous();

    // All commands besides preserve can be called as a function
    if (
      command.type !== TokenType.preserve &&
      this.check(TokenType.bracketOpen)
    ) {
      // Note this back only exists because of identifier led statement quarks
      this.backup();
      return this.identifierLedStatement();
    }

    this.terminal(Stmt.Command);

    return nodeResult(new Stmt.Command(command), []);
  }

  // parse command statement
  private commandExpression(): INodeResult<Stmt.CommandExpr> {
    const builder: NodeDataBuilder<Stmt.CommandExpr> = {
      command: this.previous(),
      expr: undefined,
    };

    const expr = this.expression();
    builder.expr = expr.value;

    this.terminal(Stmt.CommandExpr, builder);
    return nodeResult(new Stmt.CommandExpr(builder), expr.errors);
  }

  /**
   * Parse unset statement
   */
  private unset(): INodeResult<Stmt.Unset> {
    const builder: NodeDataBuilder<Stmt.Unset> = {
      unset: this.previous(),
      identifier: undefined,
    };

    builder.identifier = this.consumeTokensThrow(
      'Excepted identifier or "all" following keyword "unset".',
      Stmt.Unset,
      [TokenType.identifier, TokenType.all],
      builder,
    );
    this.terminal(Stmt.Unset);

    return nodeResult(new Stmt.Unset(builder), []);
  }

  /**
   * Parse unlock statement
   */
  private unlock(): INodeResult<Stmt.Unlock> {
    const builder: NodeDataBuilder<Stmt.Unlock> = {
      unlock: this.previous(),
      identifier: undefined,
    };

    builder.identifier = this.consumeTokensThrow(
      'Excpeted identifier or "all" following keyword "unlock".',
      Stmt.Unlock,
      [TokenType.identifier, TokenType.all],
      builder,
    );
    this.terminal(Stmt.Unlock);

    return nodeResult(new Stmt.Unlock(builder), []);
  }

  /**
   * Parse the set statement
   */
  private set(): INodeResult<Stmt.Set> {
    const builder: NodeDataBuilder<Stmt.Set> = {
      set: undefined,
      suffix: undefined,
      to: undefined,
      value: undefined,
    };

    builder.set = this.previous();
    const suffix = this.suffixCatch(Stmt.Set, builder, 'set');

    builder.suffix = suffix.value;
    builder.to = this.consumeTokenThrow(
      'Expected "to" following keyword "set".',
      Stmt.Set,
      TokenType.to,
      builder,
    );
    const valueResult = this.expression();

    builder.value = valueResult.value;
    this.terminal(Stmt.Set, builder);

    return nodeResult(
      new Stmt.Set(builder),
      flatten([suffix.errors, valueResult.errors]),
    );
  }

  /**
   * Parse lazy global statement
   */
  private lazyGlobal(): INodeResult<Stmt.LazyGlobal> {
    const builder: NodeDataBuilder<Stmt.LazyGlobal> = {
      atSign: this.previous(),
      lazyGlobal: undefined,
      onOff: undefined,
    };

    builder.lazyGlobal = this.consumeTokenThrow(
      'Expected keyword "lazyGlobal" following @.',
      Stmt.LazyGlobal,
      TokenType.lazyGlobal,
      builder,
    );

    builder.onOff = this.consumeTokensThrow(
      'Expected "on" or "off" following lazy global directive.',
      Stmt.LazyGlobal,
      [TokenType.on, TokenType.off],
      builder,
    );
    this.terminal(Stmt.LazyGlobal, builder);

    return nodeResult(new Stmt.LazyGlobal(builder), []);
  }

  /**
   * Parse if statement
   */
  private ifStmt(): INodeResult<Stmt.If> {
    const builder: NodeDataBuilder<Stmt.If> = {
      ifToken: undefined,
      condition: undefined,
      body: undefined,
      elseStmt: undefined,
    };

    builder.ifToken = this.previous();
    const conditionResult = this.expression();
    builder.condition = conditionResult.value;

    const declare = this.declaration();
    builder.body = declare.value;

    this.matchToken(TokenType.period);

    // if else if found parse that branch
    if (this.matchToken(TokenType.else)) {
      const elseBuilder: NodeDataBuilder<Stmt.Else> = {
        elseToken: undefined,
        body: undefined,
      };

      elseBuilder.elseToken = this.previous();
      const elseResult = this.declaration();
      elseBuilder.body = elseResult.value;

      const elseStmt = new Stmt.Else(elseBuilder);
      builder.elseStmt = elseStmt;

      this.matchToken(TokenType.period);
      return nodeResult(
        new Stmt.If(builder),
        flatten([conditionResult.errors, declare.errors, elseResult.errors]),
      );
    }

    return nodeResult(
      new Stmt.If(builder),
      flatten([conditionResult.errors, declare.errors]),
    );
  }

  /**
   * Parse until statement
   */
  private until(): INodeResult<Stmt.Until> {
    const builder: NodeDataBuilder<Stmt.Until> = {
      until: this.previous(),
      condition: undefined,
      body: undefined,
    };

    const conditionResult = this.expression();
    builder.condition = conditionResult.value;

    const declare = this.declaration();
    builder.body = declare.value;

    this.matchToken(TokenType.period);

    return nodeResult(
      new Stmt.Until(builder),
      flatten([conditionResult.errors, declare.errors]),
    );
  }

  /**
   * Parse from statement
   */
  private from(): INodeResult<Stmt.From> {
    const builder: NodeDataBuilder<Stmt.From> = {
      from: this.previous(),
      initializer: undefined,
      until: undefined,
      condition: undefined,
      step: undefined,
      increment: undefined,
      doToken: undefined,
      body: undefined,
    };

    if (this.matchToken(TokenType.curlyOpen)) {
      const initResult = this.block();
      builder.initializer = initResult.value;

      builder.until = this.consumeTokenThrow(
        'Expected "until" expression following from.',
        Stmt.From,
        TokenType.until,
        builder,
      );
      const conditionResult = this.expression();
      builder.condition = conditionResult.value;

      builder.step = this.consumeTokenThrow(
        'Expected "step" statement following until.',
        Stmt.From,
        TokenType.step,
        builder,
      );
      if (this.matchToken(TokenType.curlyOpen)) {
        const incrementResult = this.block();
        builder.increment = incrementResult.value;

        builder.doToken = this.consumeTokenThrow(
          'Expected "do" block following step.',
          Stmt.From,
          TokenType.do,
          builder,
        );
        const declare = this.declaration();
        builder.body = declare.value;

        return nodeResult(
          new Stmt.From(builder),
          flatten([
            initResult.errors,
            conditionResult.errors,
            incrementResult.errors,
            declare.errors,
          ]),
        );
      }
      throw this.error(
        this.peek(),
        Stmt.From,
        'Expected "{" followed by step block logic.',
        'Example: FROM {LOCAL x is 0.} UNTIL x >= 10 STEP { set x to x + 1. } { print x. }',
      );
    }
    throw this.error(
      this.peek(),
      Stmt.From,
      'Expected "{" followed by initializer logic',
      'Example: FROM {LOCAL x is 0.} UNTIL x >= 10 STEP { set x to x + 1. } { print x. }',
    );
  }

  /**
   * Parse when statement
   */
  private when(): INodeResult<Stmt.When> {
    const builder: NodeDataBuilder<Stmt.When> = {
      when: this.previous(),
      condition: undefined,
      then: undefined,
      body: undefined,
    };

    const conditionResult = this.expression();
    builder.condition = conditionResult.value;

    builder.then = this.consumeTokenThrow(
      'Expected "then" following "when" condition.',
      Stmt.When,
      TokenType.then,
      builder,
    );
    const declare = this.declaration();
    builder.body = declare.value;

    this.matchToken(TokenType.period);

    return nodeResult(
      new Stmt.When(builder),
      flatten([conditionResult.errors, declare.errors]),
    );
  }

  /**
   * Parse return statement
   */
  private returnStmt(): INodeResult<Stmt.Return> {
    const builder: NodeDataBuilder<Stmt.Return> = {
      returnToken: this.previous(),
      value: undefined,
    };

    const valueResult = !this.check(TokenType.period)
      ? this.expression()
      : undefined;
    let errors: IParseError[] = [];

    this.terminal(Stmt.Return, builder);

    if (!empty(valueResult)) {
      builder.value = valueResult.value;
      errors = valueResult.errors;
    }

    return nodeResult(new Stmt.Return(builder), errors);
  }

  /**
   * Parse break statement
   */
  private breakStmt(): INodeResult<Stmt.Break> {
    const breakToken = this.previous();
    this.terminal(Stmt.Break);

    return nodeResult(new Stmt.Break(breakToken), []);
  }

  /**
   * Parse switch statement
   */
  private switchStmt(): INodeResult<Stmt.Switch> {
    const builder: NodeDataBuilder<Stmt.Switch> = {
      switchToken: this.previous(),
      to: undefined,
      target: undefined,
    };

    builder.to = this.consumeTokenThrow(
      'Expected "to" following keyword "switch".',
      Stmt.Switch,
      TokenType.to,
      builder,
    );
    const targetResult = this.expression();
    builder.target = targetResult.value;

    this.terminal(Stmt.Switch, builder);

    return nodeResult(new Stmt.Switch(builder), targetResult.errors);
  }

  /**
   * Parse for statement
   */
  private forStmt(): INodeResult<Stmt.For> {
    const builder: NodeDataBuilder<Stmt.For> = {
      forToken: undefined,
      element: undefined,
      inToken: undefined,
      collection: undefined,
      body: undefined,
    };

    builder.forToken = this.previous();
    builder.element = this.consumeIdentifierThrow(
      'Expected identifier. following keyword "for"',
      Stmt.For,
      builder,
    );
    builder.inToken = this.consumeTokenThrow(
      'Expected "in" after "for" loop variable.',
      Stmt.For,
      TokenType.in,
      builder,
    );
    const collection = this.suffixCatch(Stmt.For, builder, 'collection');
    builder.collection = collection.value;

    const declare = this.declaration();
    builder.body = declare.value;

    this.matchToken(TokenType.period);

    return nodeResult(
      new Stmt.For(builder),
      flatten([collection.errors, declare.errors]),
    );
  }

  /**
   * Parse on statement
   */
  private on(): INodeResult<Stmt.On> {
    const builder: NodeDataBuilder<Stmt.On> = {
      on: this.previous(),
      suffix: undefined,
      body: undefined,
    };

    const suffix = this.suffixCatch(Stmt.On, builder, 'suffix');
    builder.suffix = suffix.value;

    const declare = this.declaration();
    builder.body = declare.value;

    return nodeResult(
      new Stmt.On(builder),
      flatten([suffix.errors, declare.errors]),
    );
  }

  /**
   * Parse toggle statement
   */
  private toggle(): INodeResult<Stmt.Toggle> {
    const builder: NodeDataBuilder<Stmt.Toggle> = {
      toggle: this.previous(),
      suffix: undefined,
    };

    const suffix = this.suffixCatch(Stmt.Toggle, builder, 'suffix');
    builder.suffix = suffix.value;

    this.terminal(Stmt.Toggle, builder);

    return nodeResult(new Stmt.Toggle(builder), suffix.errors);
  }

  /**
   * Parse wait statement
   */
  private wait(): INodeResult<Stmt.Wait> {
    const builder: NodeDataBuilder<Stmt.Wait> = {
      wait: this.previous(),
      until: undefined,
      expr: undefined,
    };

    builder.until = this.matchToken(TokenType.until)
      ? this.previous()
      : undefined;

    const expr = this.expression();
    builder.expr = expr.value;

    this.terminal(Stmt.Wait, builder);
    return nodeResult(new Stmt.Wait(builder), expr.errors);
  }

  /**
   * Parse log statement
   */
  private log(): INodeResult<Stmt.Log> {
    const builder: NodeDataBuilder<Stmt.Log> = {
      log: this.previous(),
      expr: undefined,
      to: undefined,
      target: undefined,
    };

    const expr = this.expression();
    builder.expr = expr.value;

    builder.to = this.consumeTokenThrow(
      'Expected "to" following "log" expression.',
      Stmt.Log,
      TokenType.to,
      builder,
    );

    const targetResult = this.expression();
    builder.target = targetResult.value;

    this.terminal(Stmt.Log, builder);

    return nodeResult(
      new Stmt.Log(builder),
      flatten([expr.errors, targetResult.errors]),
    );
  }

  /**
   * Parse copy statement
   */
  private copy(): INodeResult<Stmt.Copy> {
    const builder: NodeDataBuilder<Stmt.Copy> = {
      copy: this.previous(),
      target: undefined,
      toFrom: undefined,
      destination: undefined,
    };

    builder.copy = this.previous();
    const targetResult = this.expression();
    builder.target = targetResult.value;

    builder.toFrom = this.consumeTokensThrow(
      'Expected "to" or "from" following "copy" expression.',
      Stmt.Copy,
      [TokenType.from, TokenType.to],
      builder,
    );

    const destinationResult = this.expression();
    builder.destination = destinationResult.value;

    this.terminal(Stmt.Copy, builder);

    return nodeResult(
      new Stmt.Copy(builder),
      flatten([targetResult.errors, destinationResult.errors]),
    );
  }

  /**
   * Parse rename statement
   */
  private rename(): INodeResult<Stmt.Rename> {
    const builder: NodeDataBuilder<Stmt.Rename> = {
      rename: this.previous(),
      fileVolume: undefined,
      identifier: undefined,
      target: undefined,
      to: undefined,
      alternative: undefined,
    };

    builder.fileVolume = this.consumeTokensThrow(
      'Expected file or volume following keyword "rename"',
      Stmt.Rename,
      [TokenType.volume, TokenType.file],
      builder,
    );

    builder.identifier = this.consumeTokensThrow(
      'Expected identifier or file identifier following keyword "rename"',
      Stmt.Rename,
      [TokenType.identifier, TokenType.fileIdentifier],
      builder,
    );

    const targetResult = this.expression();
    builder.target = targetResult.value;

    builder.to = this.consumeTokenThrow(
      'Expected "to" following keyword "rename".',
      Stmt.Rename,
      TokenType.to,
      builder,
    );

    const alternativeResult = this.expression();
    builder.alternative = alternativeResult.value;

    this.terminal(Stmt.Rename, builder);

    return nodeResult(
      new Stmt.Rename(builder),
      flatten([targetResult.errors, alternativeResult.errors]),
    );
  }

  /**
   * Parse delete statement
   */
  private delete(): INodeResult<Stmt.Delete> {
    const builder: NodeDataBuilder<Stmt.Delete> = {
      deleteToken: this.previous(),
      target: undefined,
      from: undefined,
      volume: undefined,
    };

    const targetResult = this.expression();
    builder.target = targetResult.value;

    if (this.matchToken(TokenType.from)) {
      builder.from = this.previous();
      const volumeResult = this.expression();
      builder.volume = volumeResult.value;

      this.terminal(Stmt.Delete, builder);

      return nodeResult(
        new Stmt.Delete(builder),
        flatten([targetResult.errors, volumeResult.errors]),
      );
    }

    this.terminal(Stmt.Delete);
    return nodeResult(new Stmt.Delete(builder), targetResult.errors);
  }

  /**
   * Parse run statement
   */
  private run(): INodeResult<Stmt.Run> {
    const builder: NodeDataBuilder<Stmt.Run> = {
      run: this.previous(),
      once: undefined,
      identifier: undefined,
      open: undefined,
      args: undefined,
      close: undefined,
      on: undefined,
      expr: undefined,
    };
    const errors: IParseError[] = [];

    builder.once = this.matchToken(TokenType.once)
      ? this.previous()
      : undefined;

    builder.identifier = this.consumeTokensThrow(
      'Expected string or fileidentifier following keyword "run".',
      Stmt.Run,
      [TokenType.string, TokenType.identifier, TokenType.fileIdentifier],
    );

    // parse arguments if found
    if (this.matchToken(TokenType.bracketOpen)) {
      builder.open = this.previous();

      const argsResult = this.arguments(Stmt.Run);
      builder.args = argsResult.value;
      errors.push(...argsResult.errors);

      builder.close = this.consumeTokenThrow(
        'Expected ")" after "run" arguments.',
        Stmt.Run,
        TokenType.bracketClose,
      );
    }

    // parse arguments if found
    if (this.matchToken(TokenType.on)) {
      builder.on = this.previous();
      const expr = this.expression();
      errors.push(...expr.errors);
      builder.expr = expr.value;
    }

    this.terminal(Stmt.Run);
    // handle all the cases

    return this.addRunStmts(new Stmt.Run(builder), []);
  }

  /**
   * Parse run path statement
   */
  private runPath(): INodeResult<Stmt.RunPath> {
    const builder: NodeDataBuilder<Stmt.RunPath> = {
      runPath: this.previous(),
      open: undefined,
      expr: undefined,
      args: undefined,
      close: undefined,
    };

    builder.open = this.consumeTokenThrow(
      'Expected "(" after keyword "runPath".',
      Stmt.RunPath,
      TokenType.bracketOpen,
    );
    const exprResult = this.expression();
    builder.expr = exprResult.value;

    const args = this.matchToken(TokenType.comma)
      ? this.arguments(Stmt.RunPath)
      : undefined;

    builder.close = this.consumeTokenThrow(
      'Expected ")" after runPath arguments.',
      Stmt.RunPath,
      TokenType.bracketClose,
    );
    this.terminal(Stmt.RunPath);

    if (empty(args)) {
      return this.addRunStmts(new Stmt.RunPath(builder), exprResult.errors);
    }

    builder.args = args.value;
    return this.addRunStmts(
      new Stmt.RunPath(builder),
      flatten([exprResult.errors, args.errors]),
    );
  }

  /**
   * Parse run path once statement
   */
  private runOncePath(): INodeResult<Stmt.RunOncePath> {
    const builder: NodeDataBuilder<Stmt.RunOncePath> = {
      runPath: this.previous(),
      open: undefined,
      expr: undefined,
      args: undefined,
      close: undefined,
    };
    const errors: IParseError[] = [];

    builder.open = this.consumeTokenThrow(
      'Expected "(" after keyword "runPathOnce".',
      Stmt.RunOncePath,
      TokenType.bracketOpen,
    );
    const exprResult = this.expression();
    builder.expr = exprResult.value;

    const args = this.matchToken(TokenType.comma)
      ? this.arguments(Stmt.RunOncePath)
      : undefined;

    builder.close = this.consumeTokenThrow(
      'Expected ")" after runPathOnce arguments.',
      Stmt.RunOncePath,
      TokenType.bracketClose,
    );
    this.terminal(Stmt.RunOncePath);

    if (!empty(args)) {
      builder.args = args.value;
      errors.push(...args.errors);
    }

    return this.addRunStmts(
      new Stmt.RunOncePath(builder),
      flatten([exprResult.errors, errors]),
    );
  }

  /**
   * parse a compile statement
   */
  private compile(): INodeResult<Stmt.Compile> {
    const builder: NodeDataBuilder<Stmt.Compile> = {
      compile: this.previous(),
      target: undefined,
      to: undefined,
      destination: undefined,
    };

    const targetResult = this.expression();
    builder.target = targetResult.value;
    const errors: IParseError[] = targetResult.errors;

    if (this.matchToken(TokenType.to)) {
      builder.to = this.previous();

      const destinationResult = this.expression();
      builder.destination = destinationResult.value;
      errors.push(...destinationResult.errors);
    }

    this.terminal(Stmt.Compile);
    return nodeResult(new Stmt.Compile(builder), errors);
  }

  /**
   * Parse a list statement
   */
  private list(): INodeResult<Stmt.List> {
    const builder: NodeDataBuilder<Stmt.List> = {
      list: this.previous(),
      collection: undefined,
      inToken: undefined,
      target: undefined,
    };

    if (this.matchIdentifier()) {
      builder.collection = this.previous();
      if (this.matchToken(TokenType.in)) {
        builder.inToken = this.previous();
        builder.target = this.consumeIdentifierThrow(
          'Expected identifier after "in" keyword in "list" command',
          Stmt.List,
          builder,
        );
      }
    }

    this.terminal(Stmt.List, builder);
    return nodeResult(new Stmt.List(builder), []);
  }

  /**
   * Parse a print statement
   */
  private print(): INodeResult<Stmt.Stmt> {
    const builder: NodeDataBuilder<Stmt.Print> = {
      print: undefined,
      expr: undefined,
      at: undefined,
      open: undefined,
      x: undefined,
      y: undefined,
      close: undefined,
    };
    builder.print = this.previous();

    // if we find function variant of print use that instead
    if (this.check(TokenType.bracketOpen)) {
      // Note this back only exists because of identifier led statement quarks
      this.backup();
      return this.identifierLedStatement();
    }

    const expr = this.expression();
    builder.expr = expr.value;

    if (this.matchToken(TokenType.at)) {
      builder.at = this.previous();
      builder.open = this.consumeTokenThrow(
        'Expected "(".',
        Stmt.Print,
        TokenType.bracketOpen,
        builder,
      );

      const xResult = this.expression();
      builder.x = xResult.value;

      this.consumeTokenThrow(
        'Expected ",".',
        Stmt.Print,
        TokenType.comma,
        builder,
      );

      const yResult = this.expression();
      builder.y = yResult.value;

      builder.close = this.consumeTokenThrow(
        'Expected ")".',
        Stmt.Print,
        TokenType.bracketClose,
        builder,
      );

      this.terminal(Stmt.Print);
      return nodeResult(
        new Stmt.Print(builder),
        flatten([expr.errors, xResult.errors, yResult.errors]),
      );
    }

    this.terminal(Stmt.Print, builder);
    return nodeResult(new Stmt.Print(builder), expr.errors);
  }

  /**
   * Parse an expression
   */
  private expression(): INodeResult<IExpr> {
    const start = this.current;

    try {
      switch (this.peek().type) {
        // open curly is a lambda
        case TokenType.curlyOpen:
          this.advance();
          return this.lambda();
        // choose indicates ternary
        case TokenType.choose:
          this.advance();
          return this.ternary();
        // other match conditional
        default:
          return this.or();
      }
    } catch (error) {
      if (error instanceof ParseError) {
        this.logger.verbose(JSON.stringify(error.partial));
        this.synchronize(error.failed);

        const tokens = this.tokens.slice(start, this.current);

        return {
          errors: [error],
          value: new Expr.Invalid(
            start === this.current ? this.peek().end : tokens[0].start,
            tokens,
            error.partial,
          ),
        };
      }

      throw error;
    }
  }

  /**
   * Parse ternary expression
   */
  private ternary(): INodeResult<IExpr> {
    const builder: NodeDataBuilder<Expr.Ternary> = {
      choose: this.previous(),
      trueExpr: undefined,
      ifToken: undefined,
      condition: undefined,
      elseToken: undefined,
      falseExpr: undefined,
    };

    const trueExpr = this.expression();
    builder.trueExpr = trueExpr.value;

    builder.ifToken = this.consumeTokenThrow(
      'Expected if following true option',
      Expr.Ternary,
      TokenType.if,
      builder,
    );
    const condition = this.expression();
    builder.condition = condition.value;

    builder.elseToken = this.consumeTokenThrow(
      'Expected else following condition',
      Expr.Ternary,
      TokenType.else,
      builder,
    );
    const falseExpr = this.expression();
    builder.falseExpr = falseExpr.value;

    return nodeResult(
      new Expr.Ternary(builder),
      flatten([condition.errors, trueExpr.errors, falseExpr.errors]),
    );
  }

  // parse or expression
  private or(): INodeResult<IExpr> {
    return this.binaryExpression(this.andBind, [TokenType.or]);
  }

  // parse and expression
  private and(): INodeResult<IExpr> {
    return this.binaryExpression(this.eqaulityBind, [TokenType.and]);
  }

  // parse equality expression
  private equality(): INodeResult<IExpr> {
    return this.binaryExpression(this.comparisonBind, [
      TokenType.equal,
      TokenType.notEqual,
    ]);
  }

  // parse comparison expression
  private comparison(): INodeResult<IExpr> {
    return this.binaryExpression(this.additionBind, [
      TokenType.less,
      TokenType.greater,
      TokenType.lessEqual,
      TokenType.greaterEqual,
    ]);
  }

  // parse addition expression
  private addition(): INodeResult<IExpr> {
    return this.binaryExpression(this.multiplicationBind, [
      TokenType.plus,
      TokenType.minus,
    ]);
  }

  // parse multiplication expression
  private multiplication(): INodeResult<IExpr> {
    return this.binaryExpression(this.unaryBind, [
      TokenType.multi,
      TokenType.div,
    ]);
  }

  // binary expression parser
  private binaryExpression = (
    subExpression: () => INodeResult<IExpr>,
    types: TokenType[],
  ): INodeResult<IExpr> => {
    let expr = subExpression();

    while (this.matchTokens(types)) {
      const builder: NodeDataBuilder<Expr.Binary> = {
        left: expr.value,
        operator: this.previous(),
      };

      const right = subExpression();
      builder.right = right.value;

      expr.errors.push(...right.errors);
      expr = nodeResult(new Expr.Binary(builder), expr.errors);
    }

    return expr;
  }

  // parse unary expression
  private unary(): INodeResult<IExpr> {
    // if unary token found parse as unary
    if (
      this.matchTokens([
        TokenType.plus,
        TokenType.minus,
        TokenType.not,
        TokenType.defined,
      ])
    ) {
      const operator = this.previous();
      const unary = this.unary();
      return nodeResult(new Expr.Unary(operator, unary.value), unary.errors);
    }

    // else parse plain factor
    return this.factor();
  }

  // parse factor expression
  private factor(): INodeResult<IExpr> {
    // parse suffix
    let expr: INodeResult<IExpr> = this.suffix();

    // parse sequence of factors if they exist
    while (this.matchToken(TokenType.power)) {
      const power = this.previous();
      const exponent = this.suffix();
      expr = nodeResult(
        new Expr.Factor(expr.value, power, exponent.value),
        exponent.errors,
      );
    }

    return expr;
  }

  // parse suffix for use in stmt directly, will catch
  private suffixCatch<T, K extends keyof NodeDataBuilder<T>>(
    stmt: Constructor<Stmt.Stmt>,
    builder?: NodeDataBuilder<T>,
    key?: K,
  ): INodeResult<Expr.Suffix> {
    try {
      return this.suffix();
    } catch (error) {
      if (error instanceof ParseError) {
        error.failed.stmt = stmt;

        if (!empty(builder) && !empty(key)) {
          this.attachPartial<T, K>(builder, key, error.partial);
          error.partial = builder as PartialNode;
        }

        throw error;
      }

      throw error;
    }
  }

  // parse suffix
  private suffix(): INodeResult<Expr.Suffix> {
    const suffixTerm = this.suffixTerm(false);
    const suffix = new Expr.Suffix(suffixTerm.value);
    const errors: IParseError[] = suffixTerm.errors;

    // check to see if expr is really a suffix
    if (this.matchToken(TokenType.colon)) {
      // parse first suffix term
      let colon = this.previous();
      let suffixTerm = this.suffixTerm(true);
      errors.push(...suffixTerm.errors);

      // patch suffix with new trailer
      const suffixTrailer = new SuffixTerm.SuffixTrailer(suffixTerm.value);
      suffix.colon = colon;
      suffix.trailer = suffixTrailer;
      let current = suffixTrailer;

      // while there are more trailer parse down
      while (this.matchToken(TokenType.colon)) {
        colon = this.previous();
        suffixTerm = this.suffixTerm(true);
        const suffixTrailer = new SuffixTerm.SuffixTrailer(suffixTerm.value);

        // patch current trailer with trailer update current
        current.colon = colon;
        current.trailer = suffixTrailer;
        current = suffixTrailer;
        errors.push(...suffixTerm.errors);
      }
    }

    return nodeResult(suffix, errors);
  }

  // parse suffix term expression
  private suffixTerm(isTrailer: boolean): INodeResult<SuffixTerm.SuffixTerm> {
    // parse atom
    const atom = this.atom(isTrailer);
    const trailers: SuffixTermTrailer[] = [];
    const parseErrors: IParseError[] = atom.errors;

    const isValid = !(atom.value instanceof SuffixTerm.Invalid);
    // parse any trailers that exist
    while (isValid) {
      if (this.matchToken(TokenType.arrayIndex)) {
        const index = this.arrayIndex();
        trailers.push(index.value);
        parseErrors.push(...index.errors);
      } else if (this.matchToken(TokenType.squareOpen)) {
        const bracket = this.arrayBracket();
        trailers.push(bracket.value);
        parseErrors.push(...bracket.errors);
      } else if (this.matchToken(TokenType.bracketOpen)) {
        const trailer = this.functionTrailer();
        trailers.push(trailer.value);
        parseErrors.push(...trailer.errors);
      } else if (this.matchToken(TokenType.atSign)) {
        trailers.push(new SuffixTerm.Delegate(this.previous()));
        break;
      } else {
        break;
      }
    }

    return nodeResult(
      new SuffixTerm.SuffixTerm(atom.value, trailers),
      parseErrors,
    );
  }

  // function call
  private functionTrailer(): INodeResult<SuffixTerm.Call> {
    const open = this.previous();
    const args = this.arguments(SuffixTerm.Call);
    const close = this.consumeTokenThrow(
      'Expect ")" after arguments.',
      SuffixTerm.Call,
      TokenType.bracketClose,
    );

    return nodeResult(
      new SuffixTerm.Call(open, args.value, close),
      args.errors,
    );
  }

  // get an argument list
  private arguments(context: NodeConstructor): INodeResult<IExpr[]> {
    const args: IExpr[] = [];
    const errors: IParseError[][] = [];

    if (!this.isAtEnd() && !this.check(TokenType.bracketClose)) {
      do {
        // if we are expecting an argument but find a closing
        // bracket we report an error and stop arguments
        if (this.check(TokenType.bracketClose)) {
          args.push(new Expr.Invalid(this.previous().end, [this.previous()]));
          errors.push([
            this.error(this.previous(), context, 'Expected another argument.'),
          ]);
          break;
        }

        const arg = this.expression();
        args.push(arg.value);
        errors.push(arg.errors);
      } while (this.matchToken(TokenType.comma));
    }

    return nodeResult(args, flatten(errors));
  }

  // generate array bracket expression
  private arrayBracket(): INodeResult<SuffixTerm.BracketIndex> {
    const open = this.previous();
    const index = this.expression();

    const close = this.consumeTokenThrow(
      'Expected "]" at end of array index.',
      SuffixTerm.BracketIndex,
      TokenType.squareClose,
    );

    return nodeResult(
      new SuffixTerm.BracketIndex(open, index.value, close),
      index.errors,
    );
  }

  // generate array index expression
  private arrayIndex(): INodeResult<SuffixTerm.HashIndex> {
    const indexer = this.previous();

    // check for integer or identifier
    const index = this.consumeTokensThrow(
      'Expected integer or identifer.',
      SuffixTerm.HashIndex,
      [TokenType.integer, TokenType.identifier],
    );

    return nodeResult(new SuffixTerm.HashIndex(indexer, index), []);
  }

  // parse lambda expression
  private lambda(): INodeResult<Expr.Lambda> {
    const { value, errors } = this.block();
    return nodeResult(new Expr.Lambda(value), errors);
  }

  // match atom expressions literals, identifers, list, and parenthesis
  private atom(isTrailer: boolean): INodeResult<Atom> {
    // match all literals
    if (
      this.matchTokens([
        TokenType.false,
        TokenType.true,
        TokenType.fileIdentifier,
        TokenType.string,
        TokenType.integer,
        TokenType.double,
      ])
    ) {
      return nodeResult(new SuffixTerm.Literal(this.previous()), []);
    }

    // match identifiers TODO identifier all keywords that can be used here
    if (isValidIdentifier(this.peek().type)) {
      return nodeResult(new SuffixTerm.Identifier(this.advance()), []);
    }

    // match grouping expression
    if (this.matchToken(TokenType.bracketOpen)) {
      const open = this.previous();
      const expr = this.expression();
      const close = this.consumeTokenThrow(
        'Expect ")" after expression',
        SuffixTerm.Grouping,
        TokenType.bracketClose,
      );

      return nodeResult(
        new SuffixTerm.Grouping(open, expr.value, close),
        expr.errors,
      );
    }

    if (isTrailer) {
      const previous = this.previous();

      return nodeResult(new SuffixTerm.Invalid(previous.end), [
        this.error(previous, undefined, 'Expected suffix', undefined),
      ]);
    }

    // valid expression not found
    throw this.error(this.peek(), undefined, 'Expected expression.');
  }

  private addRunStmts<T extends RunStmtType>(
    stmt: T,
    errors: IParseError[],
  ): INodeResult<T> {
    this.runStmts.push(stmt);
    return nodeResult(stmt, errors);
  }

  /**
   * Check the the statement is terminated
   * @param failed failed constructor context
   * @param partialNode partially constructed node
   */
  private terminal(failed: NodeConstructor, partialNode?: PartialNode): Token {
    return this.consumeTokenThrow(
      'Expected ".".',
      failed,
      TokenType.period,
      partialNode,
    );
  }

  /**
   * Check for any valid identifier throws
   * error if incorrect token is found
   * @param message message if token is not found
   * @param failed failed construcotor
   * @param partialNode partially constructed node
   */
  private consumeIdentifierThrow(
    message: string,
    failed: NodeConstructor,
    partialNode?: PartialNode,
  ): Token {
    if (this.matchIdentifier()) return this.previous();
    throw this.error(this.previous(), failed, message, undefined, partialNode);
  }

  /**
   * Consume current token if it matches the supplied type
   * throw error if incorrect token is found
   * @param message error message
   * @param failed fail context
   * @param tokenType token type
   * @param partialNode partially constructed node
   */
  private consumeTokenThrow(
    message: string,
    failed: NodeConstructor,
    tokenType: TokenType,
    partialNode?: PartialNode,
  ): Token {
    if (this.matchToken(tokenType)) return this.previous();
    throw this.error(this.previous(), failed, message, undefined, partialNode);
  }

  /**
   * Consume current token if it matches one of the supplied types
   * throw error if incorrect token is found
   * @param message error message
   * @param failed fail context
   * @param tokenTypes token types
   * @param partialNode partially constructed node
   */
  private consumeTokensThrow(
    message: string,
    failed: NodeConstructor,
    tokenTypes: TokenType[],
    partialNode?: PartialNode,
  ): Token {
    if (this.matchTokens(tokenTypes)) return this.previous();
    throw this.error(this.previous(), failed, message, undefined, partialNode);
  }

  /**
   * Consume current token if it matches one of the supplied types
   * returns error if incorrect token is found
   * @param message error message
   * @param failed fail context
   * @param tokenTypes token types
   * @param partialNode partially constructed node
   */
  private consumeTokenReturn(
    message: string,
    failed: NodeConstructor,
    tokenType: TokenType[],
    partialNode?: PartialNode,
  ): Token | IParseError {
    if (this.matchTokens(tokenType)) return this.previous();
    return this.error(this.previous(), failed, message, undefined, partialNode);
  }

  // was identifier matched
  private matchIdentifier(): boolean {
    const found = this.identifierCheck();
    if (found) this.advance();

    return found;
  }

  private matchToken(type: TokenType): boolean {
    const found = this.check(type);
    if (found) this.advance();
    return found;
  }

  // determine if current token matches a set of tokens
  private matchTokens(types: TokenType[]): boolean {
    if (this.isAtEnd()) return false;
    const current = this.peek().type;

    for (let i = 0; i < types.length; i += 1) {
      if (current === types[i]) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  // check if current token can be an identifier
  private identifierCheck(): boolean {
    if (this.isAtEnd()) return false;
    return isValidIdentifier(this.peek().type);
  }

  // check if current token matches expected type
  private check(tokenType: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === tokenType;
  }

  // check if the next token matches expected type
  private checkNext(tokenType: TokenType): boolean {
    const nextToken = this.peekNext();
    if (empty(nextToken)) return false;
    return nextToken.type === tokenType;
  }

  // return current token and advance
  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current += 1;
    }
    return this.previous();
  }

  // TODO REMOVE ME
  // return current token and backup
  private backup(): Token {
    const current = this.peek();
    if (this.current !== 0) {
      this.current -= 1;
    }
    return current;
  }

  // is parse at the end of file
  private isAtEnd(): boolean {
    return this.peek().type === TokenType.eof;
  }

  // peek current token
  private peek(): Token {
    return this.tokens[this.current];
  }

  // peek next token
  private peekNext(): Maybe<Token> {
    const nextToken = this.tokens[this.current + 1];
    if (empty(nextToken) || nextToken.type === TokenType.eof) return undefined;

    return nextToken;
  }

  // retrieve previous token
  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  // report parse error
  private error(
    token: Token,
    failed: Maybe<NodeConstructor>,
    message: string,
    moreInfo?: string,
    partialNode?: PartialNode,
  ): IParseError {
    if (empty(failed)) {
      return new ParseError(
        token,
        failedUnknown(),
        message,
        moreInfo,
        partialNode,
      );
    }

    if (failed.prototype instanceof Expr.Expr) {
      return new ParseError(
        token,
        failedExpr(failed as { new (): Expr.Expr }),
        message,
        moreInfo,
        partialNode,
      );
    }
    if (failed.prototype instanceof Stmt.Stmt) {
      return new ParseError(
        token,
        failedStmt(failed as { new (): Stmt.Stmt }),
        message,
        moreInfo,
        partialNode,
      );
    }

    return new ParseError(
      token,
      failedUnknown(),
      message,
      moreInfo,
      partialNode,
    );
  }

  /**
   * Attach some partial value to a builder
   * @param builder builder
   * @param key key of builder to attach to
   * @param partial partial value
   */
  private attachPartial<T, K extends keyof NodeDataBuilder<T>>(
    builder: NodeDataBuilder<T>,
    key: K,
    partial: any,
  ): void {
    builder[key] = partial;
  }

  // attempt to synchronize parser
  private synchronize(failed: FailedConstructor): void {
    // need to confirm this is the only case
    if (empty(failed.stmt)) {
      this.advance();
    }

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

        // variable statements
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

        // io statements
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

        // close scope
        case TokenType.curlyClose:
          return;
        default:
          break;
      }

      this.advance();
    }
  }
}
