import { ResolverError } from './resolverError';
import { empty } from '../utilities/typeGuards';
import { ScopeType, IExpr, ISuffixTerm } from '../parser/types';
import { KsVariable } from '../entities/variable';
import { SymbolState, IScope, IScopeNode,
  KsSymbol, IStack, IKsSymbolTracker, KsSymbolKind,
} from './types';
import { KsFunction } from '../entities/function';
import { KsLock } from '../entities/lock';
import { Range } from 'vscode-languageserver';
import { IToken } from '../entities/types';
import { KsParameter } from '../entities/parameters';
import { ScopePosition } from './scopePosition';
import { mockLogger } from '../utilities/logger';
import { Scope } from './scope';
import { KsSymbolTracker, createEnitityChange } from './tracker';
import { IArgumentType, IFunctionType } from '../typeChecker/types/types';
import { SymbolTable } from './symbolTable';
import { isKsVariable, isKsParameter, isKsLock } from '../entities/entityHelpers';

/**
 * The Symbol table builder is used to declare new symbols and track new symbols
 * in the kerboscript program
 */
export class SymbolTableBuilder {

  /**
   * The global scope for this file
   */
  private readonly global: IScope;

  /**
   * The root scope include the global scope and it's children
   */
  private readonly rootScope: IScopeNode;

  /**
   * The active path in the scope
   */
  private activeScopePath: IStack<number>;

  /**
   * A secondary scope used to indicate where new scopes should go
   */
  private backTrackPath: IStack<number>;

  /**
   * A set of child symbols tables relative to this symbols table builder
   */
  public childSymbolTables: Set<SymbolTable>;

  /**
   * logger class to reporting errors and infomation
   */
  public logger: ILogger;

  /**
   * construct a symbol table builder
   * @param uri the file uri
   * @param logger a logger object
   */
  constructor(public readonly uri: string, logger: ILogger = mockLogger) {
    this.logger = logger;
    this.global = new Scope();
    this.rootScope = {
      scope: this.global,
      children: [],
      position: { tag: 'global' },
    };
    this.activeScopePath = [];
    this.backTrackPath = [];
    this.childSymbolTables = new Set();
  }

  /**
   * Generate a symbol table
   */
  public build(): SymbolTable {
    return new SymbolTable(
      this.rootScope,
      this.childSymbolTables,
      this.uri,
      this.logger,
    );
  }

  /**
   * Rewind the current scope path for a second pass
   */
  public rewindScope(): void {
    this.activeScopePath = [];
    this.backTrackPath = [];
  }

  /**
   * Add a child symbol table to this symbol table builder
   * @param symbolTable the child symbol table
   */
  public addScope(symbolTable: SymbolTable): void {
    this.childSymbolTables.add(symbolTable);
  }

  /**
   * Push a new scope onto the scope stack
   * @param range the range of the new scope
   */
  public beginScope(range: Range): void {
    const depth = this.activeScopePath.length - 1;
    const next = !empty(this.backTrackPath[depth + 1])
      ? this.backTrackPath[depth + 1] + 1 : 0;

    const activeNode = this.activeScopeNode();

    if (empty(activeNode.children[next])) {
      activeNode.children.push({
        scope: new Scope(),
        position: new ScopePosition(range.start, range.end),
        children: [],
      });
    }

    this.logger.verbose(`begin scope at ${JSON.stringify(range.start)}`);

    this.activeScopePath.push(next);
    this.backTrackPath = [...this.activeScopePath];
  }

  /**
   * Pop the current scope off the stack
   */
  public endScope(): ResolverError[] {
    const { scope, position } = this.activeScopeNode();
    this.activeScopePath.pop();

    const errors = [];
    if (!empty(scope)) {
      for (const tracker of scope.values()) {
        switch (tracker.declared.symbol.tag) {
          case KsSymbolKind.function:
            break;
          case KsSymbolKind.parameter:
            if (tracker.usages.length === 0) {
              errors.push(new ResolverError(
                tracker.declared.symbol.name,
                `Parameter ${tracker.declared.symbol.name.lexeme} was not used.`, []));
            }
            break;
          case KsSymbolKind.lock:
            if (!tracker.declared.symbol.cooked && tracker.usages.length === 0) {
              errors.push(new ResolverError(
                tracker.declared.symbol.name,
                `Lock ${tracker.declared.symbol.name.lexeme} was not used.`, []));
            }
            break;
          case KsSymbolKind.variable:
            if (tracker.usages.length === 0) {
              errors.push(new ResolverError(
                tracker.declared.symbol.name,
                `Variable ${tracker.declared.symbol.name.lexeme} was not used.`, []));
            }
            break;
          default:
            throw new Error();
        }
      }
    }

    if (position.tag === 'real') {
      this.logger.verbose(`end scope at ${JSON.stringify(position.end)}`);
    }
    return errors;
  }

  /**
   * Indicate if the current scope if file scope
   */
  public isFileScope(): boolean {
    return this.scopeDepth() === 2;
  }

  /**
   * Indicate if the current scope if global scope
   */
  public isGlobalScope(): boolean {
    return this.activeScopeNode() === this.rootScope;
  }

  /**
   * Returns the current scope depth
   */
  public scopeDepth(): number {
    return this.activeScopeStack().length;
  }

  /**
   * Use a symbol in the symbol table
   * @param name token for the current symbol
   * @param expr the expresion the symbol was used in
   */
  public useSymbol(name: IToken, expr: IExpr | ISuffixTerm): Maybe<ResolverError> {
    const tracker = this.lookup(name, ScopeType.global);

    // check if symbols exists
    if (empty(tracker)) {
      return new ResolverError(name, `Symbol ${name.lexeme} may not exist`, []);
    }

    return this.checkUseSymbol(name, tracker, tracker.declared.symbol.tag, expr);
  }

  /**
   * Use a variable symbol
   * @param name token for the current variable
   * @param expr the expression the symbol was used in
   */
  public useVariable(name: IToken, expr?: IExpr): Maybe<ResolverError> {
    const variable = this.lookupVariableTracker(name, ScopeType.global);

    return this.checkUseSymbol(name, variable, KsSymbolKind.variable, expr);
  }

  /**
   * Use a function symbol
   * @param name token for the current function
   * @param expr the expression the symbol was used in
   */
  public useFunction(name: IToken, expr?: IExpr): Maybe<ResolverError> {
    const func = this.lookupFunctionTracker(name, ScopeType.global);

    return this.checkUseSymbol(name, func, KsSymbolKind.function, expr);
  }

  /**
   * Use a lock symbol
   * @param name token for the current lock
   * @param expr the expression the symbol was used in
   */
  public useLock(name: IToken, expr?: IExpr):
    Maybe<ResolverError> {
    const lock = this.lookupLockTracker(name, ScopeType.global);

    return this.checkUseSymbol(name, lock, KsSymbolKind.lock, expr);
  }

  /**
   * Use a parameter symbol
   * @param name token for the current parameter
   * @param expr the expression the symbol was used in
   */
  public useParameter(name: IToken, expr: IExpr): Maybe<ResolverError> {
    const parameter = this.lookupParameterTracker(name, ScopeType.global);

    return this.checkUseSymbol(name, parameter, KsSymbolKind.parameter, expr);
  }

  /**
   * Add a new variable symbol to the table
   * @param scopeType the requested scope type
   * @param name token for the requested variable
   * @param type type to declare variable as
   */
  public declareVariable(scopeType: ScopeType, name: IToken, type?: IArgumentType):
    Maybe<ResolverError> {
    const tracker = this.lookup(name, scopeType);

    // check if variable has already been defined
    if (!empty(tracker)) {
      return this.localConflictError(name, tracker.declared.symbol);
    }

    const scope = this.selectScope(scopeType);

    scope.set(name.lexeme, new KsSymbolTracker(new KsVariable(scopeType, name), type));
    this.logger.verbose(`declare variable ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  /**
   * Add a new function symbol to the table
   * @param scopeType the requested scope type
   * @param name token for the requested function
   * @param parameters parameters for the function
   * @param returnValue does the function have a return type
   * @param type type to declare function as
   */
  public declareFunction(
    scopeType: ScopeType,
    name: IToken,
    parameters: KsParameter[],
    returnValue: boolean,
    type?: IFunctionType): Maybe<ResolverError> {
    const tracker = this.lookup(name, scopeType);

    // check if variable has already been defined
    if (!empty(tracker)) {
      return this.localConflictError(name, tracker.declared.symbol);
    }

    const scope = this.selectScope(scopeType);
    scope.set(name.lexeme, new KsSymbolTracker(
      new KsFunction(
        scopeType, name,
        parameters, returnValue),
      type));

    this.logger.verbose(`declare function ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  /**
   * Add a new lock symbol to the table
   * @param scopeType the requested scope type
   * @param name token for the requested lock
   * @param type type to declare lock as
   */
  public declareLock(
    scopeType: ScopeType,
    name: IToken,
    type?: IArgumentType): Maybe<ResolverError> {
    const tracker = this.lookup(name, scopeType);

    // check if variable has already been defined
    if (!empty(tracker)) {
      return this.localConflictError(name, tracker.declared.symbol);
    }

    const scope = this.selectScope(scopeType);

    scope.set(
      name.lexeme,
      new KsSymbolTracker(new KsLock(scopeType, name), type));
    this.logger.verbose(`declare lock ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  /**
   * Add a new parameter symbol to the table
   * @param scopeType the requested scope type
   * @param name token for the requested parameter
   * @param defaulted is the parameter defaulted
   */
  public declareParameter(
    scopeType: ScopeType,
    name: IToken,
    defaulted: boolean): Maybe<ResolverError> {
    const tracker = this.lookup(name, scopeType);

    // check if variable has already been defined
    if (!empty(tracker)) {
      return this.localConflictError(name, tracker.declared.symbol);
    }

    const scope = this.selectScope(scopeType);
    scope.set(
      name.lexeme,
      new KsSymbolTracker(new KsParameter(name, defaulted, SymbolState.declared)));
    this.logger.verbose(`declare parameter ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  /**
   * check if the symbol exist and add a usage if it does
   * @param name token for the requested symbol
   * @param tracker symbol tracker
   * @param symbolType symbol type
   * @param expr expression context
   */
  public checkUseSymbol(
    name: IToken,
    tracker: Maybe<IKsSymbolTracker>,
    symbolType: KsSymbolKind,
    expr?: IExpr | ISuffixTerm):
    Maybe<ResolverError> {
    // check that variable has already been defined
    if (empty(tracker)) {
      return new ResolverError(name, `${symbolType} ${name.lexeme} may not exist.`, []);
    }

    tracker.usages.push(createEnitityChange(name, expr));
    this.logger.verbose(`Use ${symbolType} ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  /**
   * Lookup a binding ie. variable or parameter
   * @param token token for the requested binding
   * @param scope requested scope lookup
   */
  public lookupBinding (token: IToken, scope: ScopeType):
  Maybe<KsVariable | KsParameter> {
    const tracker = this.lookupBindingTracker(token, scope);
    return tracker && tracker.declared.symbol;
  }

  /**
   * Lookup a variable
   * @param token token for the requested variable
   * @param scope requested scope lookup
   */
  public lookupVariable(token: IToken, scope: ScopeType): Maybe<KsVariable> {
    const tracker = this.lookupVariableTracker(token, scope);
    return tracker && tracker.declared.symbol;
  }

  /**
   * lookup a function
   * @param token token for the requested function
   * @param scope requested scope lookup
   */
  public lookupFunction(token: IToken, scope: ScopeType): Maybe<KsFunction> {
    const tracker = this.lookupFunctionTracker(token, scope);
    return tracker && tracker.declared.symbol;
  }

  /**
   * lookup a lock
   * @param token token for the requested lock
   * @param scope requested scope lookup
   */
  public lookupLock(token: IToken, scope: ScopeType): Maybe<KsLock> {
    const tracker = this.lookupLockTracker(token, scope);
    return tracker && tracker.declared.symbol;
  }

  /**
   * lookup a parameter
   * @param token token for the requested parameter
   * @param scope requested scope lookup
   */
  public lookupParameter(token: IToken, scope: ScopeType): Maybe<KsParameter> {
    const tracker = this.lookupParameterTracker(token, scope);
    return tracker && tracker.declared.symbol;
  }

  /**
   * lookup a binding tracker ie. variable or parameter
   * @param token token for the requested binding
   * @param scope requested scope lookup
   */
  public lookupBindingTracker(token: IToken, scope: ScopeType):
    Maybe<IKsSymbolTracker<KsVariable | KsParameter>> {
    const tracker = this.lookup(token, scope);

    return !empty(tracker)
      && (isKsVariable(tracker.declared.symbol)
      || isKsParameter(tracker.declared.symbol))
      ? tracker as IKsSymbolTracker<KsVariable | KsParameter>
      : undefined;
  }

  /**
   * lookup a variable tracker
   * @param token token for the requested variable
   * @param scope requested scope lookup
   */
  public lookupVariableTracker(token: IToken, scope: ScopeType):
    Maybe<IKsSymbolTracker<KsVariable>> {
    const tracker = this.lookup(token, scope);

    return !empty(tracker) && isKsVariable(tracker.declared.symbol)
      ? tracker as IKsSymbolTracker<KsVariable>
      : undefined;
  }

  /**
   * lookup a function tracker
   * @param token token for the requested function
   * @param scope requested scope lookup
   */
  public lookupFunctionTracker(token: IToken, scope: ScopeType):
    Maybe<IKsSymbolTracker<KsFunction>> {
    const tracker = this.lookup(token, scope);

    return !empty(tracker) && isKsVariable(tracker.declared.symbol)
      ? tracker as IKsSymbolTracker<KsFunction>
      : undefined;
  }

  /**
   * lookup a lock tracker
   * @param token token for the requested lock
   * @param scope requested scope lookup
   */
  public lookupLockTracker(token: IToken, scope: ScopeType):
    Maybe<IKsSymbolTracker<KsLock>> {
    const tracker = this.lookup(token, scope);

    return !empty(tracker) && isKsLock(tracker.declared.symbol)
      ? tracker as IKsSymbolTracker<KsLock>
      : undefined;
  }

  /**
   * lookup a parameter tracker
   * @param token token for the requested parameter
   * @param scope requested scope lookup
   */
  public lookupParameterTracker(token: IToken, scope: ScopeType):
    Maybe<IKsSymbolTracker<KsParameter>> {
    const tracker = this.lookup(token, scope);

    return !empty(tracker) && isKsParameter(tracker.declared.symbol)
      ? tracker as IKsSymbolTracker<KsParameter>
      : undefined;
  }

  /**
   * Lookup a symbol in the active scope stack
   * @param token token for the requested symbol
   * @param scope scope type for the lookup local or global
   */
  private lookup(token: IToken, scope: ScopeType): Maybe<IKsSymbolTracker> {
    if (scope === ScopeType.local) {
      return this.peekScope().get(token.lexeme);
    }

    const scopes = this.activeScopeStack();
    for (let i = scopes.length - 1; i >= 0; i -= 1) {
      const scope = scopes[i];
      const tracker = scope.get(token.lexeme);
      if (!empty(tracker)) {
        return tracker;
      }
    }

    // check child scopes symbol is in another file
    for (const child of this.childSymbolTables) {
      const tracker = child.rootScope.scope.get(token.lexeme);
      if (!empty(tracker)) {
        return tracker;
      }
    }

    return undefined;
  }

  /**
   * Retrieve the appropriate scope
   * @param type scope type global or local
   */
  private selectScope(type: ScopeType): IScope {
    return type === ScopeType.global
      ? this.global
      : this.peekScope();
  }

  /**
   * Get the currently active scope node
   */
  private activeScopeNode(): IScopeNode {
    let scopeNode = this.rootScope;

    for (const scopeId of this.activeScopePath) {
      scopeNode = scopeNode.children[scopeId];

      if (empty(scopeNode)) {
        throw new Error(`Unable to find scope node for path ${
          JSON.stringify(this.activeScopePath)}`);
      }
    }

    return scopeNode;
  }

  /**
   * Generate an actual scope of the current scope path
   */
  private activeScopeStack(): IStack<IScope> {
    const scopes: IStack<IScope> = [this.rootScope.scope];
    let scopeNode = this.rootScope;

    for (const scopeId of this.activeScopePath) {
      scopeNode = scopeNode.children[scopeId];

      if (empty(scopeNode)) {
        throw new Error(`Unable to find scope stack for path ${
          JSON.stringify(this.activeScopePath)}`);
      }
      scopes.push(scopeNode.scope);
    }
    return scopes;
  }

  /**
   * Retrieve the currently active scope
   */
  private peekScope(): IScope {
    return this.activeScopeNode().scope;
  }

  /**
   * generate a resolver error when a declare symbol collides with an existing on
   * @param name token for the requested symbol
   * @param symbol collided symbol
   */
  private localConflictError(name: IToken, symbol: KsSymbol): ResolverError {
    return new ResolverError(
      name, `${this.pascalCase(KsSymbolKind[symbol.tag])} ${symbol.name.lexeme}`
        + ` already exists here ${this.rangeToString(symbol.name)}.`,
      []);
  }

  /**
   * convert a range to a string
   * @param range a file range
   */
  private rangeToString(range: Range): string {
    const sameLine = range.start.line === range.end.line;
    const line = sameLine
      ? (range.start.line + 1).toString()
      : `${range.start.line + 1}-${range.end.line + 1}`;

    const sameColumn = range.start.character === range.end.character;
    const column = sameLine && sameColumn
      ? (range.start.character + 1).toString()
      : `${range.start.character + 1}-${range.end.character + 1}`;

    return `line: ${line} column: ${column}`;
  }

  /**
   * Convert a string to pascalCase
   * @param str string
   */
  private pascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
