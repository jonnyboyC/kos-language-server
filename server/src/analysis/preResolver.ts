import {
  IStmtVisitor,
  IExprVisitor,
  IStmt,
  ScopeKind,
  IExpr,
  ISuffixTerm,
  ISuffixTermVisitor,
  IScript,
} from '../parser/types';
import * as SuffixTerm from '../parser/suffixTerm';
import * as Expr from '../parser/expr';
import * as Stmt from '../parser/stmt';
import { Var, Lock, Func, Param } from '../parser/declare';
import { empty } from '../utilities/typeGuards';
import { TokenType } from '../entities/tokentypes';
import { mockLogger, mockTracer, logException } from '../utilities/logger';
import { SymbolTableBuilder } from './symbolTableBuilder';
import { Diagnostic } from 'vscode-languageserver';
import { FunctionScan } from './functionScan';

export type Diagnostics = Diagnostic[];

/**
 * The pre resolver run prior to the resolver. Its main purpose is to
 * find and store function declaration location of functions is kerboscripts
 * does not matter.
 */
export class PreResolver
  implements
    IExprVisitor<Diagnostics>,
    IStmtVisitor<Diagnostics>,
    ISuffixTermVisitor<Diagnostics> {
  /**
   * current script being processed
   */
  private script: IScript;

  /**
   * symbol table builder
   */
  private tableBuilder: SymbolTableBuilder;

  /**
   * logger
   */
  private readonly logger: ILogger;

  /**
   * tracer
   */
  private readonly tracer: ITracer;

  /**
   * function scan to find parameters and return
   * statements
   */
  private readonly functionScan: FunctionScan;

  /**
   * Pre resolver constructor
   * @param script pre resolver script
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
    this.logger = logger;
    this.tracer = tracer;
    this.functionScan = new FunctionScan();
  }

  /**
   * Perform an initial resolver pass on the script statements,
   * for function declarations
   */
  public resolve(): Diagnostics {
    try {
      const splits = this.script.uri.split('/');
      const file = splits[splits.length - 1];

      this.logger.info(`Function Resolving started for ${file}.`);

      this.tableBuilder.rewind();
      this.tableBuilder.beginScope(this.script);

      const resolveErrors = this.resolveStmts(this.script.stmts);
      this.tableBuilder.endScope();

      this.logger.info(`Function Resolving finished for ${file}`);

      if (resolveErrors.length) {
        this.logger.warn(
          `Function Resolver encountered ${resolveErrors.length} errors`,
        );
      }

      return resolveErrors;
    } catch (err) {
      this.logger.error('Error occurred in resolver');
      logException(this.logger, this.tracer, err, LogLevel.error);

      return [];
    }
  }

  // resolve the given set of statements
  public resolveStmts(stmts: IStmt[]): Diagnostics {
    return accumulateErrors(stmts, this.resolveStmt.bind(this));
  }

  // resolve for an statement
  private resolveStmt(stmt: IStmt): Diagnostics {
    return stmt.accept(this);
  }

  // resolve for an expression
  private resolveExpr(expr: IExpr): Diagnostics {
    return expr.accept(this);
  }

  // resolve for an expression
  private resolveSuffixTerm(suffixTerm: ISuffixTerm): Diagnostics {
    return suffixTerm.accept(this);
  }

  /* --------------------------------------------

  Declarations

  ----------------------------------------------*/

  // check variable declaration
  public visitDeclVariable(decl: Var): Diagnostics {
    return this.resolveExpr(decl.value);
  }

  // check lock declaration
  public visitDeclLock(decl: Lock): Diagnostics {
    return this.resolveExpr(decl.value);
  }

  /**
   * Because function don't need forward declaration in kerboscript
   * we need to find and add their symbols first
   * @param decl function declaration
   */
  public visitDeclFunction(decl: Func): Diagnostics {
    const scopeToken = decl.scope && decl.scope.scope;

    let scopeType: ScopeKind;

    // functions are default global at file scope and local everywhere else
    if (empty(scopeToken)) {
      scopeType = this.tableBuilder.isFileScope()
        ? ScopeKind.global
        : ScopeKind.local;
    } else {
      switch (scopeToken.type) {
        case TokenType.local:
          scopeType = ScopeKind.local;
          break;
        case TokenType.global:
          scopeType = ScopeKind.global;
          break;
        default:
          throw new Error(
            'Unexpected scope token encountered. Expected local or global.',
          );
      }
    }

    const result = this.functionScan.scan(decl.block);
    const declareErrors = this.tableBuilder.declareFunction(
      scopeType,
      decl.identifier,
      result.requiredParameters,
      result.optionalParameters,
      result.return,
    );
    const stmtErrors = this.resolveStmt(decl.block);

    if (!empty(declareErrors)) {
      stmtErrors.push(declareErrors);
    }
    return stmtErrors;
  }

  // check parameter declaration
  public visitDeclParameter(_: Param): Diagnostics {
    return [];
  }

  /* --------------------------------------------

  Statements

  ----------------------------------------------*/

  public visitStmtInvalid(_: Stmt.Invalid): Diagnostics {
    return [];
  }

  public visitBlock(stmt: Stmt.Block): Diagnostics {
    this.tableBuilder.beginScope(stmt);
    const errors = this.resolveStmts(stmt.stmts);
    this.tableBuilder.endScope();

    return errors;
  }

  public visitExpr(stmt: Stmt.ExprStmt): Diagnostics {
    return this.resolveExpr(stmt.suffix);
  }

  public visitOnOff(stmt: Stmt.OnOff): Diagnostics {
    return this.resolveExpr(stmt.suffix);
  }

  public visitCommand(_: Stmt.Command): Diagnostics {
    return [];
  }

  public visitCommandExpr(stmt: Stmt.CommandExpr): Diagnostics {
    return this.resolveExpr(stmt.expr);
  }

  public visitUnset(_: Stmt.Unset): Diagnostics {
    return [];
  }

  public visitUnlock(_: Stmt.Unlock): Diagnostics {
    return [];
  }

  public visitSet(stmt: Stmt.Set): Diagnostics {
    return this.resolveExpr(stmt.value);
  }

  public visitLazyGlobal(_: Stmt.LazyGlobal): Diagnostics {
    return [];
  }

  public visitIf(stmt: Stmt.If): Diagnostics {
    const errors = this.resolveExpr(stmt.condition);
    errors.push(...this.resolveStmt(stmt.body));

    if (stmt.elseStmt) {
      errors.push(...this.resolveStmt(stmt.elseStmt));
    }

    return errors;
  }

  public visitElse(stmt: Stmt.Else): Diagnostics {
    return this.resolveStmt(stmt.body);
  }

  public visitUntil(stmt: Stmt.Until): Diagnostics {
    const errors = this.resolveExpr(stmt.condition);
    errors.push(...this.resolveStmt(stmt.body));

    return errors;
  }

  public visitFrom(stmt: Stmt.From): Diagnostics {
    const errors = this.resolveStmts(stmt.initializer.stmts);
    errors.push(
      ...this.resolveExpr(stmt.condition),
      ...this.resolveStmts(stmt.increment.stmts),
      ...this.resolveStmt(stmt.body),
    );

    return errors;
  }

  public visitWhen(stmt: Stmt.When): Diagnostics {
    const errors = this.resolveExpr(stmt.condition);
    errors.push(...this.resolveStmt(stmt.body));
    return errors;
  }

  public visitReturn(stmt: Stmt.Return): Diagnostics {
    if (stmt.value) {
      return this.resolveExpr(stmt.value);
    }

    return [];
  }

  public visitBreak(_: Stmt.Break): Diagnostics {
    return [];
  }

  public visitSwitch(stmt: Stmt.Switch): Diagnostics {
    return this.resolveExpr(stmt.target);
  }

  public visitFor(stmt: Stmt.For): Diagnostics {
    const errors = this.resolveExpr(stmt.collection);
    errors.push(...this.resolveStmt(stmt.body));

    return errors;
  }

  public visitOn(stmt: Stmt.On): Diagnostics {
    const errors = this.resolveExpr(stmt.suffix);
    errors.push(...this.resolveStmt(stmt.body));

    return errors;
  }

  public visitToggle(stmt: Stmt.Toggle): Diagnostics {
    return this.resolveExpr(stmt.suffix);
  }

  public visitWait(stmt: Stmt.Wait): Diagnostics {
    return this.resolveExpr(stmt.expr);
  }

  public visitLog(stmt: Stmt.Log): Diagnostics {
    const errors = this.resolveExpr(stmt.expr);
    errors.push(...this.resolveExpr(stmt.target));

    return errors;
  }

  public visitCopy(stmt: Stmt.Copy): Diagnostics {
    const errors = this.resolveExpr(stmt.target);
    errors.push(...this.resolveExpr(stmt.destination));

    return errors;
  }

  public visitRename(stmt: Stmt.Rename): Diagnostics {
    const errors = this.resolveExpr(stmt.target);
    errors.push(...this.resolveExpr(stmt.alternative));

    return errors;
  }

  public visitDelete(stmt: Stmt.Delete): Diagnostics {
    const errors = this.resolveExpr(stmt.target);
    if (empty(stmt.volume)) {
      return errors;
    }

    errors.push(...this.resolveExpr(stmt.volume));
    return errors;
  }

  public visitRun(stmt: Stmt.Run): Diagnostics {
    if (empty(stmt.args)) {
      return [];
    }

    return accumulateErrors(stmt.args, this.resolveExpr.bind(this));
  }

  public visitRunPath(stmt: Stmt.RunPath): Diagnostics {
    if (empty(stmt.args)) {
      return this.resolveExpr(stmt.expr);
    }

    const errors = this.resolveExpr(stmt.expr);
    errors.push(...accumulateErrors(stmt.args, this.resolveExpr.bind(this)));
    return errors;
  }

  public visitRunPathOnce(stmt: Stmt.RunOncePath): Diagnostics {
    if (empty(stmt.args)) {
      return this.resolveExpr(stmt.expr);
    }

    const errors = this.resolveExpr(stmt.expr);
    errors.push(...accumulateErrors(stmt.args, this.resolveExpr.bind(this)));

    return errors;
  }

  public visitCompile(stmt: Stmt.Compile): Diagnostics {
    if (empty(stmt.destination)) {
      return this.resolveExpr(stmt.target);
    }

    const errors = this.resolveExpr(stmt.target);
    errors.push(...this.resolveExpr(stmt.destination));
    return errors;
  }

  public visitList(_: Stmt.List): Diagnostics {
    return [];
  }

  public visitEmpty(_: Stmt.Empty): Diagnostics {
    return [];
  }

  public visitPrint(stmt: Stmt.Print): Diagnostics {
    return this.resolveExpr(stmt.expr);
  }

  /* --------------------------------------------

  Expressions

  ----------------------------------------------*/

  public visitExprInvalid(_: Expr.Invalid): Diagnostics {
    return [];
  }

  public visitTernary(expr: Expr.Ternary): Diagnostic[] {
    const errors = this.resolveExpr(expr.condition);
    errors.push(
      ...this.resolveExpr(expr.trueBranch),
      ...this.resolveExpr(expr.falseBranch),
    );

    return errors;
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
    const errors = this.resolveSuffixTerm(expr.suffixTerm);
    if (!empty(expr.trailer)) {
      errors.push(...this.resolveSuffixTerm(expr.trailer));
    }

    return errors;
  }

  public visitLambda(expr: Expr.Lambda): Diagnostics {
    return this.resolveStmt(expr.block);
  }

  /* --------------------------------------------

  Suffix Terms

  ----------------------------------------------*/

  public visitSuffixTermInvalid(_: SuffixTerm.Invalid): Diagnostics {
    return [];
  }

  public visitSuffixTrailer(expr: SuffixTerm.SuffixTrailer): Diagnostics {
    const errors = this.resolveSuffixTerm(expr.suffixTerm);
    if (!empty(expr.trailer)) {
      errors.push(...this.resolveSuffixTerm(expr.trailer));
    }

    return errors;
  }

  public visitSuffixTerm(expr: SuffixTerm.SuffixTerm): Diagnostics {
    const errors = this.resolveSuffixTerm(expr.atom);
    for (const trailer of expr.trailers) {
      errors.push(...this.resolveSuffixTerm(trailer));
    }

    return errors;
  }

  public visitCall(expr: SuffixTerm.Call): Diagnostics {
    return accumulateErrors(expr.args, this.resolveExpr.bind(this));
  }

  public visitArrayIndex(_: SuffixTerm.ArrayIndex): Diagnostics {
    return [];
  }

  public visitArrayBracket(expr: SuffixTerm.ArrayBracket): Diagnostics {
    return this.resolveExpr(expr.index);
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

  public visitGrouping(expr: SuffixTerm.Grouping): Diagnostics {
    return this.resolveExpr(expr.expr);
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
