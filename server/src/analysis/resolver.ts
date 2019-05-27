import {
  IStmtVisitor,
  IExpr,
  IStmt,
  ScopeKind,
  ISuffixTerm,
  IScript,
  IExprVisitor,
  ISuffixTermVisitor,
  SyntaxKind,
} from '../parser/types';
import * as SuffixTerm from '../parser/suffixTerm';
import * as Expr from '../parser/expr';
import * as Stmt from '../parser/stmt';
import * as Decl from '../parser/declare';
import { empty } from '../utilities/typeGuards';
import { LocalResolver } from './localResolver';
import { SetResolver } from './setResolver';
import { TokenType } from '../entities/tokentypes';
import { Script } from '../entities/script';
import { mockLogger, mockTracer } from '../utilities/logger';
import { SymbolTableBuilder } from './symbolTableBuilder';
import { IDeferred } from './types';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { createDiagnostic } from '../utilities/diagnosticsUtils';
// tslint:disable-next-line: import-name
import Denque from 'denque';
import { flatten } from '../utilities/arrayUtils';
import { Token } from '../entities/token';

type Diagnostics = Diagnostic[];

export class Resolver
  implements
    IStmtVisitor<Diagnostics>,
    IExprVisitor<Diagnostics>,
    ISuffixTermVisitor<Diagnostics> {
  /**
   * Script the resolver executes on
   */
  private readonly script: Script;

  /**
   * Symbol table builder
   */
  private readonly tableBuilder: SymbolTableBuilder;

  /**
   * Logger to log messages
   */
  private readonly logger: ILogger;

  /**
   * Tracer to log traces
   */
  private readonly tracer: ITracer;

  /**
   * Local resolver to find used local symbols in an expression
   */
  private readonly localResolver: LocalResolver;

  /**
   * Set resolver to find set symbols and used symbols
   */
  private readonly setResolver: SetResolver;

  /**
   * Queue of deferred nodes to execute
   */
  private readonly deferred: Denque<IDeferred>;

  /**
   * Is the script using the lazy global directive
   */
  private lazyGlobal: boolean;

  /**
   * Is this the first statement of the script
   */
  private firstStmt: boolean;

  /**
   * Should resolution be deferred
   */
  private deferResolve: boolean;

  /**
   * How many functions deep is the current location
   */
  private functionDepth: number;

  /**
   * How many loops deep is the current location
   */
  private loopDepth: number;

  /**
   * Cached bound method for resolving statement
   */
  private readonly resolveStmtBind = this.resolveStmt.bind(this);

  /**
   * Cached bound method for using locals in an expreesion
   */
  private readonly useExprLocalsBind = this.useExprLocals.bind(this);

  /**
   * Cached bound method for resolving an expression
   */
  private readonly resolveExprBind = this.resolveExpr.bind(this);

  /**
   * Resolver constructor
   * @param script script to resolve
   * @param symbolTableBuilder symbol table builder
   * @param logger logger
   * @param tracer tracer
   */
  constructor(
    script: IScript,
    symbolTableBuilder: SymbolTableBuilder,
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer,
  ) {
    this.script = script;
    this.tableBuilder = symbolTableBuilder;
    this.localResolver = new LocalResolver();
    this.setResolver = new SetResolver(this.localResolver);
    this.deferred = new Denque();
    this.lazyGlobal = true;
    this.firstStmt = true;
    this.deferResolve = true;
    this.loopDepth = 0;
    this.functionDepth = 0;

    this.logger = logger;
    this.tracer = tracer;
  }

  /**
   * Resolve a script
   */
  public resolve(): Diagnostics {
    try {
      const splits = this.script.uri.split('/');
      const file = splits[splits.length - 1];

      this.logger.info(`Resolving started for ${file}.`);

      this.tableBuilder.rewind();
      this.tableBuilder.beginScope(this.script);
      const [firstStmt, ...restStmts] = this.script.stmts;

      // check for lazy global flag
      const errors = this.resolveStmt(firstStmt);
      this.firstStmt = false;

      // resolve reset
      const resolveErrors = this.resolveStmts(restStmts);
      this.tableBuilder.endScope();

      this.script.lazyGlobal = this.lazyGlobal;
      this.deferResolve = false;

      // process all deferred nodes
      let current: Maybe<IDeferred>;
      errors.push(...resolveErrors);

      // process deferred queue
      while ((current = this.deferred.shift())) {
        this.deferResolve = false;

        // set scope path and current depths
        this.tableBuilder.setPath(current.path, current.activeScope);
        this.functionDepth = current.functionDepth;
        this.loopDepth = current.loopDepth;

        // resolve deferred node
        switch (current.node.tag) {
          case SyntaxKind.expr:
            errors.push(...this.resolveExpr(current.node));
            break;
          case SyntaxKind.stmt:
            errors.push(...this.resolveStmt(current.node));
            break;
        }
      }

      this.logger.info(`Resolving finished for ${file}`);

      if (errors.length) {
        this.logger.warn(`Resolver encounted ${errors.length} errors`);
      }
      return errors;
    } catch (err) {
      this.logger.error(`Error occured in resolver ${err}`);
      this.tracer.log(err);

      return [];
    }
  }

  /**
   * Resolve the given set of statements
   * @param stmts statements
   */
  private resolveStmts(stmts: IStmt[]): Diagnostics {
    return accumulateErrors(stmts, this.resolveStmtBind);
  }

  /**
   * Resolve statement
   * @param stmt resolve statement
   */
  private resolveStmt(stmt: IStmt): Diagnostics {
    return stmt.accept(this);
  }

  /**
   * Pass through expression
   * @param expr expression to skip
   */
  private resolveExpr(expr: IExpr): Diagnostics {
    return expr.accept(this);
  }

  /**
   * Pass through suffix term
   * @param suffixTerm suffix term to skip
   */
  private resolveSuffixTerm(suffixTerm: ISuffixTerm): Diagnostics {
    return suffixTerm.accept(this);
  }

  /**
   * attempt to use ever variable in the expression
   * @param expr expression to use
   */
  private useExprLocals(expr: IExpr): Diagnostics {
    return this.useTokens(this.localResolver.resolveExpr(expr));
  }

  /**
   * attempt to use ever token in the collection
   * @param tokens local results to use
   */
  private useTokens(tokens: Token[]): Diagnostics {
    const errors: Diagnostics = [];
    for (const token of tokens) {
      const error = this.tableBuilder.useSymbol(token);
      if (!empty(error)) {
        errors.push(error);
      }
    }

    return errors;
  }

  /**
   * filter to just errors
   * @param maybeError potential error
   */
  private filterError(maybeError: Maybe<Diagnostic>): maybeError is Diagnostic {
    return !empty(maybeError);
  }

  /* --------------------------------------------

  Declarations

  ----------------------------------------------*/

  /**
   * Visit the declare variable syntax node
   * @param decl the syntax node
   */
  public visitDeclVariable(decl: Decl.Var): Diagnostics {
    // determine scope type
    const scopeType = !empty(decl.scope) ? decl.scope.type : ScopeKind.global;

    const declareError = this.tableBuilder.declareVariable(
      scopeType,
      decl.identifier,
    );
    const errors = this.useExprLocals(decl.value);
    errors.push(...this.resolveExpr(decl.value));

    if (!empty(declareError)) {
      errors.push(declareError);
    }

    return errors;
  }

  /**
   * Visit the declare lock syntax node
   * @param decl the syntax node
   */
  public visitDeclLock(decl: Decl.Lock): Diagnostic[] {
    // determine scope type
    const scopeType = !empty(decl.scope) ? decl.scope.type : ScopeKind.global;

    const lookup = this.tableBuilder.lookupLock(
      decl.identifier,
      ScopeKind.global,
    );
    let declareError: Maybe<Diagnostic> = undefined;

    if (empty(lookup)) {
      declareError = this.tableBuilder.declareLock(scopeType, decl.identifier);
    }

    const errors = this.useExprLocals(decl.value);
    errors.push(...this.resolveExpr(decl.value));

    if (!empty(declareError)) {
      errors.push(declareError);
    }

    return errors;
  }

  /**
   * Visit the declare function syntax node
   * @param decl the syntax node
   */
  public visitDeclFunction(decl: Decl.Func): Diagnostic[] {
    if (this.executeDeferred()) {
      return this.deferNode(decl, decl.block);
    }

    return this.trackFunction(() => this.resolveStmt(decl.block));
  }

  /**
   * Visit the declare parameter syntax node
   * @param decl the syntax node
   */
  public visitDeclParameter(decl: Decl.Param): Diagnostic[] {
    const errors: Diagnostic[] = [];

    // check that parameter isn't declared global
    if (!empty(decl.scope) && !empty(decl.scope.scope)) {
      if (decl.scope.scope.type === TokenType.global) {
        errors.push(
          createDiagnostic(
            decl.scope.scope,
            'Parameters cannot be global',
            DiagnosticSeverity.Error,
          ),
        );
      }
    }

    // all parameters are local
    const scopeType = ScopeKind.local;

    // need to check if default paraemter can really be abbitrary expr
    const parameterErrors = decl.requiredParameters
      .map(parameter =>
        this.tableBuilder.declareParameter(
          scopeType,
          parameter.identifier,
          false,
        ),
      )
      .filter(this.filterError);

    const defaultParameterErrors = decl.optionalParameters
      .map(parameter =>
        this.tableBuilder.declareParameter(
          scopeType,
          parameter.identifier,
          true,
        ),
      )
      .filter(this.filterError);

    const defaultUseErrors = decl.optionalParameters.map(parameter =>
      this.useExprLocals(parameter.value),
    );

    errors.push(
      ...parameterErrors,
      ...defaultParameterErrors,
      ...flatten(defaultUseErrors),
    );

    return errors;
  }

  /* --------------------------------------------

  Statements

  ----------------------------------------------*/

  /**
   * Visit the Invalid Stmt syntax node
   * @param stmt the syntax node
   */
  public visitStmtInvalid(stmt: Stmt.Invalid): Diagnostics {
    if (empty(stmt.partial)) {
      return [];
    }

    const errors: Diagnostics = [];

    // check parsed partial nodes
    for (const node of Object.values(stmt.partial)) {
      if (node instanceof Stmt.Stmt) {
        errors.push(...this.resolveStmt(node));
      }

      if (node instanceof Expr.Expr) {
        errors.push(...this.useExprLocalsBind(node));
        errors.push(...this.resolveExpr(node));
      }
    }

    return errors;
  }

  /**
   * Visit the Block Stmt syntax node
   * @param stmt the syntax node
   */
  public visitBlock(stmt: Stmt.Block): Diagnostics {
    this.tableBuilder.beginScope(stmt);
    const errors = this.resolveStmts(stmt.stmts);
    this.tableBuilder.endScope();

    return errors;
  }

  /**
   * Visit the Expr Stmt syntax node
   * @param stmt the syntax node
   */
  public visitExpr(stmt: Stmt.ExprStmt): Diagnostics {
    return this.useExprLocals(stmt.suffix).concat(
      this.resolveExpr(stmt.suffix),
    );
  }

  /**
   * Visit the On Off Stmt syntax node
   * @param stmt the syntax node
   */
  public visitOnOff(stmt: Stmt.OnOff): Diagnostics {
    return this.useExprLocals(stmt.suffix).concat(
      this.resolveExpr(stmt.suffix),
    );
  }

  /**
   * Visit the Command Stmt syntax node
   * @param _ the syntax node
   */
  public visitCommand(_: Stmt.Command): Diagnostics {
    return [];
  }

  /**
   * Visit the Command Expr Stmt syntax node
   * @param stmt the syntax node
   */
  public visitCommandExpr(stmt: Stmt.CommandExpr): Diagnostics {
    return this.useExprLocals(stmt.expr).concat(this.resolveExpr(stmt.expr));
  }

  /**
   * Visit the Unset Stmt syntax node
   * @param stmt the syntax node
   */
  public visitUnset(stmt: Stmt.Unset): Diagnostics {
    const error = this.tableBuilder.useVariable(stmt.identifier);
    return empty(error) ? [] : [error];
  }

  /**
   * Visit the Unlock Stmt syntax node
   * @param stmt the syntax node
   */
  public visitUnlock(stmt: Stmt.Unlock): Diagnostics {
    const error = this.tableBuilder.useLock(stmt.identifier);
    return empty(error) ? [] : [error];
  }

  /**
   * Visit the Set Stmt syntax node
   * @param stmt the syntax node
   */
  public visitSet(stmt: Stmt.Set): Diagnostics {
    const { set, used } = this.setResolver.resolveExpr(stmt.suffix);

    // check if a set target exists
    if (empty(set)) {
      const [token] = this.localResolver.resolveExpr(stmt.suffix);
      return [
        createDiagnostic(
          token,
          `cannot assign to variable ${token.lexeme}`,
          DiagnosticSeverity.Error,
        ),
      ];
    }

    const errors = this.setBinding(set);
    errors.push(
      ...this.useExprLocals(stmt.value),
      ...this.useTokens(used),
      ...this.resolveExpr(stmt.value),
    );

    return errors;
  }

  /**
   * Visit the Lazy Global Stmt syntax node
   * @param stmt the syntax node
   */
  public visitLazyGlobal(stmt: Stmt.LazyGlobal): Diagnostics {
    // It is an error if lazy global is not at the start of a file
    if (!this.firstStmt) {
      return [
        createDiagnostic(
          stmt.lazyGlobal,
          'Lazy global was not declared at top of the file',
          DiagnosticSeverity.Error,
        ),
      ];
    }

    this.lazyGlobal = stmt.onOff.type === TokenType.on;
    return [];
  }

  /**
   * Visit the If Stmt syntax node
   * @param stmt the syntax node
   */
  public visitIf(stmt: Stmt.If): Diagnostics {
    const errors = this.useExprLocals(stmt.condition);
    errors.push(
      ...this.resolveExpr(stmt.condition),
      ...this.resolveStmt(stmt.body),
    );

    if (stmt.elseStmt) {
      errors.push(...this.resolveStmt(stmt.elseStmt));
    }

    return errors;
  }

  /**
   * Visit the Else Stmt syntax node
   * @param stmt the syntax node
   */
  public visitElse(stmt: Stmt.Else): Diagnostics {
    return this.resolveStmt(stmt.body);
  }

  /**
   * Visit the When Stmt syntax node
   * @param stmt the syntax node
   */
  public visitUntil(stmt: Stmt.Until): Diagnostics {
    const errors = this.useExprLocals(stmt.condition);
    errors.push(...this.resolveExpr(stmt.condition));
    errors.push(...this.trackLoop(() => this.resolveStmtBind(stmt.body)));
    return errors;
  }

  /**
   * Visit the From Stmt syntax node
   * @param stmt the syntax node
   */
  public visitFrom(stmt: Stmt.From): Diagnostics {
    // begin hidden loop scope
    this.tableBuilder.beginScope(stmt);

    const errors = this.resolveStmts(stmt.initializer.stmts);
    errors.push(
      ...this.resolveExpr(stmt.condition),
      ...this.useExprLocalsBind(stmt.condition),
      ...this.resolveStmts(stmt.increment.stmts),
    );

    errors.push(...this.trackLoop(() => this.resolveStmt(stmt.body)));

    // end hidden loop scope
    this.tableBuilder.endScope();
    return errors;
  }

  /**
   * Visit the When Stmt syntax node
   * @param stmt the syntax node
   */
  public visitWhen(stmt: Stmt.When): Diagnostics {
    if (this.executeDeferred()) {
      return this.deferNode(stmt, stmt.body);
    }

    const errors = this.useExprLocalsBind(stmt.condition);
    errors.push(
      ...this.resolveExpr(stmt.condition),
      ...this.resolveStmt(stmt.body),
    );

    return errors;
  }

  /**
   * Visit the Return Stmt syntax node
   * @param stmt the syntax node
   */
  public visitReturn(stmt: Stmt.Return): Diagnostics {
    const errors: Diagnostics = [];

    if (stmt.value) {
      errors.push(
        ...this.useExprLocalsBind(stmt.value),
        ...this.resolveExpr(stmt.value),
      );
    }

    if (this.functionDepth < 1) {
      errors.push(createDiagnostic(
        stmt.returnToken,
        'Return appeared outside of function body',
        DiagnosticSeverity.Error,
      ));
    }

    return errors;
  }

  /**
   * Visit the Break Stmt syntax node
   * @param stmt the syntax node
   */
  public visitBreak(stmt: Stmt.Break): Diagnostics {
    return this.loopDepth < 1
      ? [
          createDiagnostic(
            stmt,
            'Break appeared outside of a loop',
            DiagnosticSeverity.Error,
          ),
        ]
      : [];
  }

  /**
   * Visit the Switch Stmt syntax node
   * @param stmt the syntax node
   */
  public visitSwitch(stmt: Stmt.Switch): Diagnostics {
    return this.useExprLocalsBind(stmt.target).concat(
      this.resolveExpr(stmt.target),
    );
  }

  /**
   * Visit the For Stmt syntax node
   * @param stmt the syntax node
   */
  public visitFor(stmt: Stmt.For): Diagnostics {
    return this.trackLoop(() => {
      this.tableBuilder.beginScope(stmt);
      const errors: Diagnostics = [];

      const declareError = this.tableBuilder.declareVariable(
        ScopeKind.local,
        stmt.element,
      );
      if (!empty(declareError)) {
        errors.push(declareError);
      }

      errors.push(
        ...this.useExprLocalsBind(stmt.collection),
        ...this.resolveExpr(stmt.collection),
        ...this.resolveStmt(stmt.body),
      );

      this.tableBuilder.endScope();

      if (!empty(declareError)) {
        errors.push(declareError);
      }

      return errors;
    });
  }

  /**
   * Visit the On Stmt syntax node
   * @param stmt the syntax node
   */
  public visitOn(stmt: Stmt.On): Diagnostics {
    if (this.executeDeferred()) {
      return this.deferNode(stmt, stmt.body);
    }

    return this.useExprLocalsBind(stmt.suffix).concat(
      this.resolveExpr(stmt.suffix),
      this.resolveStmt(stmt.body),
    );
  }

  /**
   * Visit the Toggle Stmt syntax node
   * @param stmt the syntax node
   */
  public visitToggle(stmt: Stmt.Toggle): Diagnostics {
    return this.useExprLocalsBind(stmt.suffix).concat(
      this.resolveExpr(stmt.suffix),
    );
  }

  /**
   * Visit the Wait Stmt syntax node
   * @param stmt the syntax node
   */
  public visitWait(stmt: Stmt.Wait): Diagnostics {
    return this.useExprLocalsBind(stmt.expr).concat(this.resolveExpr(stmt.expr));
  }

  /**
   * Visit the Log Stmt syntax node
   * @param stmt the syntax node
   */
  public visitLog(stmt: Stmt.Log): Diagnostics {
    return this.useExprLocalsBind(stmt.expr).concat(
      this.resolveExpr(stmt.expr),
      this.resolveExpr(stmt.target),
    );
  }

  /**
   * Visit the Copy Stmt syntax node
   * @param stmt the syntax node
   */
  public visitCopy(stmt: Stmt.Copy): Diagnostics {
    return this.useExprLocalsBind(stmt.target).concat(
      createDiagnostic(
        stmt,
        'Copy is deprecated as of 1.0.0',
        DiagnosticSeverity.Warning,
      ),
      this.resolveExpr(stmt.target),
      this.resolveExpr(stmt.destination),
    );
  }

  /**
   * Visit the Rename Stmt syntax node
   * @param stmt the syntax node
   */
  public visitRename(stmt: Stmt.Rename): Diagnostics {
    return this.useExprLocalsBind(stmt.target).concat(
      createDiagnostic(
        stmt,
        'Rename is deprecated as of 1.0.0',
        DiagnosticSeverity.Warning,
      ),
      this.useExprLocalsBind(stmt.alternative),
      this.resolveExpr(stmt.target),
      this.resolveExpr(stmt.alternative),
    );
  }

  /**
   * Visit the Delete Stmt syntax node
   * @param stmt the syntax node
   */
  public visitDelete(stmt: Stmt.Delete): Diagnostics {
    const deprecated = createDiagnostic(
      stmt,
      'Copy is deprecated as of 1.0.0',
      DiagnosticSeverity.Warning,
    );

    if (empty(stmt.volume)) {
      return this.useExprLocalsBind(stmt.target).concat(
        deprecated,
        this.resolveExpr(stmt.target),
      );
    }

    return this.useExprLocalsBind(stmt.target).concat(
      deprecated,
      this.useExprLocalsBind(stmt.volume),
      this.resolveExpr(stmt.target),
      this.resolveExpr(stmt.volume),
    );
  }

  /**
   * Visit the Run Stmt syntax node
   * @param stmt the syntax node
   */
  public visitRun(stmt: Stmt.Run): Diagnostics {
    if (empty(stmt.args) && empty(stmt.expr)) {
      return [];
    }

    const argError = !empty(stmt.args)
      ? accumulateErrors(stmt.args, this.useExprLocalsBind).concat(
          accumulateErrors(stmt.args, this.resolveExprBind),
        )
      : [];

    if (empty(stmt.expr)) {
      return argError;
    }

    return this.useExprLocalsBind(stmt.expr).concat(
      this.resolveExpr(stmt.expr),
      argError,
    );
  }

  /**
   * Visit the RunPath Stmt syntax node
   * @param stmt the syntax node
   */
  public visitRunPath(stmt: Stmt.RunPath): Diagnostics {
    if (empty(stmt.args)) {
      return this.useExprLocalsBind(stmt.expr).concat(this.resolveExpr(stmt.expr));
    }

    return this.useExprLocalsBind(stmt.expr).concat(
      this.resolveExpr(stmt.expr),
      accumulateErrors(stmt.args, this.useExprLocalsBind),
      accumulateErrors(stmt.args, this.resolveExprBind),
    );
  }

  /**
   * Visit the RunPathOnce Stmt syntax node
   * @param stmt the syntax node
   */
  public visitRunPathOnce(stmt: Stmt.RunOncePath): Diagnostics {
    if (empty(stmt.args)) {
      return this.useExprLocalsBind(stmt.expr).concat(this.resolveExpr(stmt.expr));
    }

    return this.useExprLocalsBind(stmt.expr).concat(
      this.resolveExpr(stmt.expr),
      accumulateErrors(stmt.args, this.useExprLocalsBind),
      accumulateErrors(stmt.args, this.resolveExprBind),
    );
  }

  /**
   * Visit the Compile Stmt syntax node
   * @param stmt the syntax node
   */
  public visitCompile(stmt: Stmt.Compile): Diagnostics {
    if (empty(stmt.destination)) {
      return this.useExprLocalsBind(stmt.target).concat(
        this.resolveExpr(stmt.target),
      );
    }

    return this.useExprLocalsBind(stmt.target).concat(
      this.useExprLocalsBind(stmt.destination),
      this.resolveExpr(stmt.target),
      this.resolveExpr(stmt.destination),
    );
  }

  /**
   * Visit the List Stmt syntax node
   * @param stmt the syntax node
   */
  public visitList(stmt: Stmt.List): Diagnostics {
    // list generates new variable when target is used
    if (empty(stmt.target)) {
      return [];
    }

    return this.setBinding(stmt.target);
  }

  /**
   * Visit the Empty Stmt syntax node
   * @param stmt the syntax node
   */
  public visitEmpty(_: Stmt.Empty): Diagnostics {
    return [];
  }

  /**
   * Visit the Print Stmt syntax node
   * @param stmt the syntax node
   */
  public visitPrint(stmt: Stmt.Print): Diagnostics {
    return this.useExprLocalsBind(stmt.expr).concat(this.resolveExpr(stmt.expr));
  }

  /**
   * Logic for settings a variable. used by set stmt and list command
   * @param set token to set
   */
  private setBinding(set: Token): Diagnostics {
    // if variable isn't defined either report error or define
    let defineError: Maybe<Diagnostic> = undefined;

    // if we find the symbol just set it
    if (!empty(this.tableBuilder.lookupBinding(set, ScopeKind.global))) {
      defineError = this.tableBuilder.setBinding(set);

      // if we didn't find it and we're not lazy global add error
    } else if (!this.lazyGlobal) {
      defineError = createDiagnostic(
        set,
        `Attempted to set ${set.lexeme} which has not been declared. ` +
          `Either remove lazy global directive or declare ${set.lexeme}`,
        DiagnosticSeverity.Error,
      );

      // not found and lazy global so declare global
    } else {
      defineError = this.tableBuilder.declareVariable(ScopeKind.global, set);
    }

    if (!empty(defineError)) {
      return [defineError];
    }

    return [];
  }

  /* --------------------------------------------

  Expressions

  ----------------------------------------------*/

  public visitExprInvalid(_: Expr.Invalid): Diagnostics {
    return [];
  }

  public visitBinary(expr: Expr.Binary): Diagnostics {
    const errors = this.resolveExpr(expr.left);
    errors.push(...this.resolveExpr(expr.right));
    return errors;
  }

  public visitUnary(expr: Expr.Unary): Diagnostics {
    return this.resolveExpr(expr.factor);
  }

  public visitFactor(expr: Expr.Factor): Diagnostics {
    const errors = this.resolveExpr(expr.suffix);
    errors.push(...this.resolveExpr(expr.exponent));
    return errors;
  }

  public visitSuffix(expr: Expr.Suffix): Diagnostics {
    const errors = this.visitSuffixTerm(expr.suffixTerm);
    if (!empty(expr.trailer)) {
      errors.push(...this.resolveSuffixTerm(expr.trailer));
    }

    return errors;
  }

  public visitLambda(expr: Expr.Lambda): Diagnostics {
    if (this.executeDeferred()) {
      return this.deferNode(expr, expr.block);
    }

    return this.trackFunction(() => this.resolveStmt(expr.block));
  }

  /* --------------------------------------------

  Suffix Terms

  ----------------------------------------------*/

  public visitSuffixTermInvalid(_: SuffixTerm.Invalid): Diagnostics {
    return [];
  }

  public visitSuffixTrailer(suffixTerm: SuffixTerm.SuffixTrailer): Diagnostics {
    const errors = this.visitSuffixTerm(suffixTerm.suffixTerm);
    if (!empty(suffixTerm.trailer)) {
      errors.push(...(this.resolveSuffixTerm(suffixTerm.trailer)));
    }

    return errors;
  }

  public visitSuffixTerm(suffixTerm: SuffixTerm.SuffixTerm): Diagnostics {
    const errors = this.resolveSuffixTerm(suffixTerm.atom);

    for (const trailer of suffixTerm.trailers) {
      errors.push(...this.resolveSuffixTerm(trailer));
    }

    return errors;
  }

  public visitCall(suffixTerm: SuffixTerm.Call): Diagnostics {
    return accumulateErrors(suffixTerm.args, this.resolveExprBind);
  }

  public visitArrayIndex(_: SuffixTerm.ArrayIndex): Diagnostics {
    return [];
  }

  public visitArrayBracket(suffixTerm: SuffixTerm.ArrayBracket): Diagnostics {
    return this.resolveExpr(suffixTerm.index);
  }

  public visitDelegate(_: SuffixTerm.Delegate): Diagnostics {
    return [];
  }

  public visitLiteral(_: SuffixTerm.Literal): Diagnostics {
    return [];
  }

  public visitIdentifier(_: SuffixTerm.Identifier): Diagnostics {
    return [];
  }

  public visitGrouping(suffixTerm: SuffixTerm.Grouping): Diagnostics {
    return this.resolveExpr(suffixTerm.expr);
  }

  /**
   * Only allow one defer node to be executed at a time
   */
  private executeDeferred(): boolean {
    if (this.deferResolve) {
      return true;
    }

    this.deferResolve = true;
    return false;
  }

  /**
   * Track when the function depth has increased or decreased
   * @param functionFunc function body
   */
  private trackFunction(functionFunc: () => Diagnostics): Diagnostics {
    this.functionDepth += 1;
    const result = functionFunc();
    this.functionDepth -= 1;
    return result;
  }

  /**
   * Tracket when the loop depth has increased or decreased
   * @param loopFunc loop body
   */
  private trackLoop(loopFunc: () => Diagnostics): Diagnostics {
    this.loopDepth += 1;
    const result = loopFunc();
    this.loopDepth -= 1;
    return result;
  }

  /**
   * Defer a node for later execution
   * @param node node to defer
   */
  private deferNode(node: IStmt | IExpr, block: IStmt): Diagnostics {
    this.deferred.push({
      node,
      functionDepth: this.functionDepth,
      loopDepth: this.loopDepth,
      ...this.tableBuilder.getPath(),
    });

    // for now kinda a hack for now may need to look at scope building again
    if (block instanceof Stmt.Block) {
      this.tableBuilder.beginScope(block);
      this.tableBuilder.endScope();
    }

    return [];
  }
}

const accumulateErrors = <T>(
  items: T[],
  checker: (item: T) => Diagnostics,
): Diagnostics => {
  const errors: Diagnostics = [];

  for (const item of items) {
    errors.push(...checker(item));
  }

  return errors;
};
