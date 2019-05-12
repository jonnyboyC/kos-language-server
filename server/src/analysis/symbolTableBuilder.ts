import { empty } from '../utilities/typeGuards';
import { ScopeKind } from '../parser/types';
import { KsVariable } from '../entities/variable';
import {
  SymbolState,
  IScope,
  IScopeNode,
  KsSymbol,
  IKsSymbolTracker,
  KsSymbolKind,
  IScopePath,
} from './types';
import { KsFunction } from '../entities/function';
import { KsLock } from '../entities/lock';
import {
  Range,
  Diagnostic,
  DiagnosticSeverity,
  DiagnosticRelatedInformation,
} from 'vscode-languageserver';
import { IToken } from '../entities/types';
import { KsParameter } from '../entities/parameters';
import { ScopePosition } from './scopePosition';
import { mockLogger } from '../utilities/logger';
import { Scope } from './scope';
import { KsSymbolTracker, createSymbolSet } from './tracker';
import { IArgumentType, IFunctionType } from '../typeChecker/types/types';
import { SymbolTable } from './symbolTable';
import {
  isKsVariable,
  isKsParameter,
  isKsLock,
} from '../entities/entityHelpers';
import {
  rangeToString,
  positionToString,
  rangeBefore,
} from '../utilities/positionUtils';
import { createDiagnostic } from '../utilities/diagnosticsUtils';
import { builtIn } from '../utilities/constants';
import { toCase } from '../utilities/stringUtils';

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
   * The active scope
   */
  private activeScope: IScopeNode;

  /**
   * The scope path in the scope
   */
  private path: IScopePath;

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
      parent: undefined,
      scope: this.global,
      children: [],
      position: { kind: ScopeKind.global },
    };
    this.activeScope = this.rootScope;
    this.path = {
      active: [],
      backTrack: [],
    };
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
   * Rewind the current scope path for another pass
   */
  public rewind(): void {
    this.path = {
      active: [],
      backTrack: [],
    };
    this.activeScope = this.rootScope;
  }

  public getPath(): { path: IScopePath; activeScope: IScopeNode } {
    return {
      activeScope: this.activeScope,
      path: {
        active: [...this.path.active],
        backTrack: [...this.path.backTrack],
      },
    };
  }

  public setPath(path: IScopePath, activeScope: IScopeNode): void {
    this.path = path;
    this.activeScope = activeScope;
  }

  /**
   * Add a child symbol table to this symbol table builder
   * @param symbolTable the child symbol table
   */
  public linkTable(symbolTable: SymbolTable): void {
    this.childSymbolTables.add(symbolTable);
  }

  /**
   * Push a new scope onto the scope stack
   * @param range the range of the new scope
   */
  public beginScope(range: Range): void {
    // determine next scope node
    const depth = this.path.active.length - 1;
    const next = !empty(this.path.backTrack[depth + 1])
      ? this.path.backTrack[depth + 1] + 1
      : 0;

    const currentScope = this.activeScope;
    let activeScope: IScopeNode;

    // generate a new scope node if it doesn't exist
    if (empty(currentScope.children[next])) {
      activeScope = {
        parent: currentScope,
        scope: new Scope(),
        position: new ScopePosition(range.start, range.end),
        children: [],
      };

      currentScope.children.push(activeScope);

      // or get the existing one
    } else {
      activeScope = currentScope.children[next];
    }

    this.activeScope = activeScope;

    this.logger.verbose(`begin scope at ${positionToString(range.start)}`);

    this.path.active.push(next);
    this.path.backTrack = [...this.path.active];
  }

  /**
   * Pop the current scope off the stack
   */
  public endScope(): void {
    const currentScope = this.activeScope;
    if (empty(currentScope.parent)) {
      throw new Error('Attempted to pop the global scope');
    }

    this.activeScope = currentScope.parent;
    this.path.active.pop();

    if (currentScope.position.kind === ScopeKind.local) {
      this.logger.verbose(
        `end scope at ${positionToString(currentScope.position.end)}`,
      );
    }
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
    return this.activeScope === this.rootScope;
  }

  /**
   * Returns the current scope depth
   */
  public scopeDepth(): number {
    return this.path.active.length;
  }

  /**
   * Find all unused symbols in this symbol table builder
   */
  public findUnused(): Diagnostic[] {
    const errors: Diagnostic[] = [];

    this.findScopeNodeUnused(this.rootScope, errors);
    return errors;
  }

  /**
   * Use a symbol in the symbol table
   * @param name token for the current symbol
   */
  public useSymbol(name: IToken): Maybe<Diagnostic> {
    const tracker = this.lookup(name.lookup, ScopeKind.global);

    // check if symbols exists
    if (empty(tracker)) {
      return createDiagnostic(
        name,
        `Symbol ${name.lexeme} may not exist`,
        DiagnosticSeverity.Warning,
      );
    }

    return this.checkUseSymbol(name, tracker, tracker.declared.symbol.tag);
  }

  /**
   * Use a variable symbol
   * @param name token for the current variable
   */
  public useVariable(name: IToken): Maybe<Diagnostic> {
    const variable = this.lookupVariableTracker(name, ScopeKind.global);

    return this.checkUseSymbol(name, variable, KsSymbolKind.variable);
  }

  /**
   * Use a function symbol
   * @param name token for the current function
   */
  public useFunction(name: IToken): Maybe<Diagnostic> {
    const func = this.lookupFunctionTracker(name, ScopeKind.global);

    return this.checkUseSymbol(name, func, KsSymbolKind.function);
  }

  /**
   * Use a lock symbol
   * @param name token for the current lock
   */
  public useLock(name: IToken): Maybe<Diagnostic> {
    const lock = this.lookupLockTracker(name, ScopeKind.global);

    return this.checkUseSymbol(name, lock, KsSymbolKind.lock);
  }

  /**
   * Use a parameter symbol
   * @param name token for the current parameter
   */
  public useParameter(name: IToken): Maybe<Diagnostic> {
    const parameter = this.lookupParameterTracker(name, ScopeKind.global);

    return this.checkUseSymbol(name, parameter, KsSymbolKind.parameter);
  }

  /**
   * Set a variable symbol
   * @param token token for the variable to set
   */
  public setBinding(token: IToken): Maybe<Diagnostic> {
    const tracker = this.lookup(token.lookup, ScopeKind.global);

    // check if variable has already been defined
    if (empty(tracker)) {
      return createDiagnostic(
        token,
        `${token.lexeme} may not exist`,
        DiagnosticSeverity.Warning,
      );
    }

    token.tracker = tracker;
    this.logger.verbose(
      `set variable ${token.lexeme} at ${rangeToString(token)}`,
    );
    return undefined;
  }

  /**
   * Add a new variable symbol to the table
   * @param scopeType the requested scope type
   * @param token token for the requested variable
   * @param type type to declare variable as
   */
  public declareVariable(
    scopeType: ScopeKind,
    token: IToken,
    type?: IArgumentType,
  ): Maybe<Diagnostic> {
    const conflictTracker = this.lookup(token.lookup, scopeType);

    // check if variable has already been defined
    if (!empty(conflictTracker)) {
      return this.localConflictError(token, conflictTracker.declared.symbol);
    }

    let diagnostic: Maybe<Diagnostic>;

    // if global we can't shadow
    if (scopeType === ScopeKind.global) {
      diagnostic = undefined;

      // if local check for shadowing hints
    } else {
      const shadowTracker = this.lookup(token.lookup, ScopeKind.global);
      diagnostic = empty(shadowTracker)
        ? undefined
        : this.shadowSymbolHint(
            token,
            KsSymbolKind.variable,
            shadowTracker.declared.symbol,
          );
    }

    const scopeNode = this.selectScopeNode(scopeType);
    const tracker = new KsSymbolTracker(
      new KsVariable(scopeType, token),
      this.uri,
      type,
    );

    token.tracker = tracker;
    scopeNode.scope.set(token.lookup, tracker);

    this.logger.verbose(
      `declare variable ${token.lexeme} at ${rangeToString(token)}`,
    );

    return diagnostic;
  }

  /**
   * Add a new function symbol to the table
   * @param scopeType the requested scope type
   * @param token token for the requested function
   * @param requiredParameters required parameters for the function
   * @param optionalParameters optional parameters for the function
   * @param returnValue does the function have a return type
   * @param type type to declare function as
   */
  public declareFunction(
    scopeType: ScopeKind,
    token: IToken,
    requiredParameters: number,
    optionalParameters: number,
    returnValue: boolean,
    type?: IFunctionType,
  ): Maybe<Diagnostic> {
    const conflictTracker = this.lookup(token.lookup, scopeType);

    // check if variable has already been defined
    if (!empty(conflictTracker)) {
      return this.localConflictError(token, conflictTracker.declared.symbol);
    }

    let diagnostic: Maybe<Diagnostic>;

    // if global we can't shadow
    if (scopeType === ScopeKind.global) {
      diagnostic = undefined;

      // if local check for shadowing hints
    } else {
      const shadowTracker = this.lookup(token.lookup, ScopeKind.global);
      diagnostic = empty(shadowTracker)
        ? undefined
        : this.shadowSymbolHint(
            token,
            KsSymbolKind.function,
            shadowTracker.declared.symbol,
          );
    }

    const scopeNode = this.selectScopeNode(scopeType);
    const tracker = new KsSymbolTracker(
      new KsFunction(
        scopeType,
        token,
        requiredParameters,
        optionalParameters,
        returnValue,
      ),
      this.uri,
      type,
    );

    token.tracker = tracker;
    scopeNode.scope.set(token.lookup, tracker);

    this.logger.verbose(
      `declare function ${token.lexeme} at ${rangeToString(token)}`,
    );

    return diagnostic;
  }

  /**
   * Add a new lock symbol to the table
   * @param scopeType the requested scope type
   * @param token token for the requested lock
   * @param type type to declare lock as
   */
  public declareLock(
    scopeType: ScopeKind,
    token: IToken,
    type?: IArgumentType,
  ): Maybe<Diagnostic> {
    const conflictTracker = this.lookup(token.lookup, scopeType);

    // check if variable has already been defined
    if (!empty(conflictTracker)) {
      return this.localConflictError(token, conflictTracker.declared.symbol);
    }

    let diagnostic: Maybe<Diagnostic>;

    // if global we can't shadow
    if (scopeType === ScopeKind.global) {
      diagnostic = undefined;

      // if local check for shadowing hints
    } else {
      const shadowTracker = this.lookup(token.lookup, ScopeKind.global);
      diagnostic = empty(shadowTracker)
        ? undefined
        : this.shadowSymbolHint(
            token,
            KsSymbolKind.lock,
            shadowTracker.declared.symbol,
          );
    }

    const scopeNode = this.selectScopeNode(scopeType);
    const tracker = new KsSymbolTracker(
      new KsLock(scopeType, token),
      this.uri,
      type,
    );

    token.tracker = tracker;
    scopeNode.scope.set(token.lookup, tracker);

    this.logger.verbose(
      `declare lock ${token.lexeme} at ${rangeToString(token)}`,
    );

    return diagnostic;
  }

  /**
   * Add a new parameter symbol to the table
   * @param scopeType the requested scope type
   * @param token token for the requested parameter
   * @param defaulted is the parameter defaulted
   */
  public declareParameter(
    scopeType: ScopeKind,
    token: IToken,
    defaulted: boolean,
  ): Maybe<Diagnostic> {
    const conflictTracker = this.lookup(token.lookup, scopeType);

    // check if variable has already been defined
    if (!empty(conflictTracker)) {
      return this.localConflictError(token, conflictTracker.declared.symbol);
    }

    let diagnostic: Maybe<Diagnostic>;

    // if global we can't shadow
    if (scopeType === ScopeKind.global) {
      diagnostic = undefined;

      // if local check for shadowing hints
    } else {
      const shadowTracker = this.lookup(token.lookup, ScopeKind.global);
      diagnostic = empty(shadowTracker)
        ? undefined
        : this.shadowSymbolHint(
            token,
            KsSymbolKind.parameter,
            shadowTracker.declared.symbol,
          );
    }

    const scopeNode = this.selectScopeNode(scopeType);
    const tracker = new KsSymbolTracker(
      new KsParameter(token, defaulted, SymbolState.declared),
      this.uri,
    );

    token.tracker = tracker;
    scopeNode.scope.set(token.lookup, tracker);

    this.logger.verbose(
      `declare parameter ${token.lexeme} at ${rangeToString(token)}`,
    );
    return diagnostic;
  }

  /**
   * check if the symbol exist and add a usage if it does
   * @param token token for the requested symbol
   * @param tracker symbol tracker
   * @param symbolType symbol type
   * @param expr expression context
   */
  public checkUseSymbol(
    token: IToken,
    tracker: Maybe<IKsSymbolTracker>,
    symbolType: KsSymbolKind,
  ): Maybe<Diagnostic> {
    // check that variable has already been defined
    if (empty(tracker)) {
      return createDiagnostic(
        token,
        `${symbolType} ${token.lexeme} may not exist.`,
        DiagnosticSeverity.Warning,
      );
    }

    // indicate usage
    token.tracker = tracker;
    tracker.usages.push(createSymbolSet(token));
    this.logger.verbose(
      `Use ${symbolType} ${token.lexeme} at ${rangeToString(token)}`,
    );

    // check if a variable may not be defined in a runtime situtation
    // functions will always be availbe because they are executed
    // during a pre pass
    if (
      rangeBefore(token, tracker.declared.range.start) &&
      tracker.declared.symbol.tag !== KsSymbolKind.function
    ) {
      return createDiagnostic(
        token,
        `${symbolType} ${token.lexeme} may not exist at script runtime.`,
        DiagnosticSeverity.Hint,
        undefined,
        [
          DiagnosticRelatedInformation.create(
            { uri: tracker.declared.uri, range: tracker.declared.range },
            `${token.lexeme} is declared after this use`,
          ),
        ],
      );
    }

    return undefined;
  }

  /**
   * Lookup a variable
   * @param token token for the requested variable
   * @param scope requested scope lookup
   */
  public lookupVariable(token: IToken, scope: ScopeKind): Maybe<KsVariable> {
    const tracker = this.lookupVariableTracker(token, scope);
    return tracker && tracker.declared.symbol;
  }

  /**
   * lookup a function
   * @param token token for the requested function
   * @param scope requested scope lookup
   */
  public lookupFunction(token: IToken, scope: ScopeKind): Maybe<KsFunction> {
    const tracker = this.lookupFunctionTracker(token, scope);
    return tracker && tracker.declared.symbol;
  }

  /**
   * lookup a lock
   * @param token token for the requested lock
   * @param scope requested scope lookup
   */
  public lookupLock(token: IToken, scope: ScopeKind): Maybe<KsLock> {
    const tracker = this.lookupLockTracker(token, scope);
    return tracker && tracker.declared.symbol;
  }

  /**
   * lookup a parameter
   * @param token token for the requested parameter
   * @param scope requested scope lookup
   */
  public lookupParameter(token: IToken, scope: ScopeKind): Maybe<KsParameter> {
    const tracker = this.lookupParameterTracker(token, scope);
    return tracker && tracker.declared.symbol;
  }

  /**
   * lookup a parameter
   * @param token token for the requested parameter
   * @param scope requested scope lookup
   */
  public lookupBinding(
    token: IToken,
    scope: ScopeKind,
  ): Maybe<KsParameter | KsVariable> {
    const tracker = this.lookupBindingTracker(token, scope);
    return tracker && tracker.declared.symbol;
  }

  /**
   * lookup a variable tracker
   * @param token token for the requested variable
   * @param scopeKind requested scope lookup
   */
  public lookupVariableTracker(
    token: IToken,
    scopeKind: ScopeKind,
  ): Maybe<IKsSymbolTracker<KsVariable>> {
    const tracker = this.lookup(token.lookup, scopeKind);

    return !empty(tracker) && isKsVariable(tracker.declared.symbol)
      ? (tracker as IKsSymbolTracker<KsVariable>)
      : undefined;
  }

  /**
   * lookup a function tracker
   * @param token token for the requested function
   * @param scopeKind requested scope lookup
   */
  public lookupFunctionTracker(
    token: IToken,
    scopeKind: ScopeKind,
  ): Maybe<IKsSymbolTracker<KsFunction>> {
    const tracker = this.lookup(token.lookup, scopeKind);

    return !empty(tracker) && isKsVariable(tracker.declared.symbol)
      ? (tracker as IKsSymbolTracker<KsFunction>)
      : undefined;
  }

  /**
   * lookup a lock tracker
   * @param token token for the requested lock
   * @param scopeKind requested scope lookup
   */
  public lookupLockTracker(
    token: IToken,
    scopeKind: ScopeKind,
  ): Maybe<IKsSymbolTracker<KsLock>> {
    const tracker = this.lookup(token.lookup, scopeKind);

    return !empty(tracker) && isKsLock(tracker.declared.symbol)
      ? (tracker as IKsSymbolTracker<KsLock>)
      : undefined;
  }

  /**
   * lookup a parameter tracker
   * @param token token for the requested parameter
   * @param scopeKind requested scope lookup
   */
  public lookupParameterTracker(
    token: IToken,
    scopeKind: ScopeKind,
  ): Maybe<IKsSymbolTracker<KsParameter>> {
    const tracker = this.lookup(token.lookup, scopeKind);

    return !empty(tracker) && isKsParameter(tracker.declared.symbol)
      ? (tracker as IKsSymbolTracker<KsParameter>)
      : undefined;
  }

  /**
   * lookup a parameter tracker
   * @param token token for the requested parameter
   * @param scopeKind requested scope lookup
   */
  public lookupBindingTracker(
    token: IToken,
    scopeKind: ScopeKind,
  ): Maybe<IKsSymbolTracker<KsParameter | KsVariable>> {
    const tracker = this.lookup(token.lookup, scopeKind);

    return !empty(tracker) &&
      (isKsParameter(tracker.declared.symbol) ||
        isKsVariable(tracker.declared.symbol))
      ? (tracker as IKsSymbolTracker<KsParameter | KsVariable>)
      : undefined;
  }

  /**
   * Find all unused symbol in a scope node that aren't used and
   * it's children
   * @param node scope node
   * @param errors cumulative errors
   */
  private findScopeNodeUnused(node: IScopeNode, errors: Diagnostic[]): void {
    this.findScopeUnused(node.scope, errors);

    for (const childNode of node.children) {
      this.findScopeNodeUnused(childNode, errors);
    }
  }

  /**
   * Find all unused symbols in a scope that aren't used
   * @param scope scope to check
   * @param errors cumulative errors
   */
  private findScopeUnused(scope: IScope, errors: Diagnostic[]): void {
    for (const tracker of scope.values()) {
      switch (tracker.declared.symbol.tag) {
        case KsSymbolKind.function:
          break;
        case KsSymbolKind.parameter:
          if (tracker.usages.length === 0) {
            errors.push(
              createDiagnostic(
                tracker.declared.symbol.name,
                `Parameter ${
                  tracker.declared.symbol.name.lexeme
                } was not used.`,
                DiagnosticSeverity.Warning,
              ),
            );
          }
          break;
        case KsSymbolKind.lock:
          if (!tracker.declared.symbol.cooked && tracker.usages.length === 0) {
            errors.push(
              createDiagnostic(
                tracker.declared.symbol.name,
                `Lock ${tracker.declared.symbol.name.lexeme} was not used.`,
                DiagnosticSeverity.Warning,
              ),
            );
          }
          break;
        case KsSymbolKind.variable:
          if (tracker.usages.length === 0) {
            errors.push(
              createDiagnostic(
                tracker.declared.symbol.name,
                `Variable ${tracker.declared.symbol.name.lexeme} was not used.`,
                DiagnosticSeverity.Warning,
              ),
            );
          }
          break;
        default:
          throw new Error('Unknown symbol found');
      }
    }
  }

  /**
   * Determine if a symbol tracker is in the current path
   * @param lookup token lookup string
   * @param scopeKind scope kind for the lookup local or global
   */
  private lookup(
    lookup: string,
    scopeKind: ScopeKind,
  ): Maybe<IKsSymbolTracker> {
    const scopeNode = this.lookupScopeNode(lookup, scopeKind);
    if (empty(scopeNode)) {
      return undefined;
    }

    return scopeNode.scope.get(lookup);
  }

  /**
   * Determine if a scope in the current path contains a symbol of interest
   * @param lookup token lookup string
   * @param scopeKind scope kind for the lookup local or global
   */
  private lookupScopeNode(
    lookup: string,
    scopeKind: ScopeKind,
  ): Maybe<IScopeNode> {
    if (scopeKind === ScopeKind.local) {
      return this.peekScope().has(lookup) ? this.activeScope : undefined;
    }

    let currentScope: Maybe<IScopeNode> = this.activeScope;
    while (!empty(currentScope)) {
      if (currentScope.scope.has(lookup)) {
        return currentScope;
      }

      currentScope = currentScope.parent;
    }

    // check child scopes symbol is in another file
    for (const child of this.childSymbolTables) {
      if (child.rootScope.scope.has(lookup)) {
        return child.rootScope;
      }
    }

    return undefined;
  }

  /**
   * Retrieve the appropriate scope
   * @param type scope type global or local
   */
  private selectScopeNode(type: ScopeKind): IScopeNode {
    return type === ScopeKind.global ? this.rootScope : this.activeScope;
  }

  /**
   * Retrieve the currently active scope
   */
  private peekScope(): IScope {
    return this.activeScope.scope;
  }

  /**
   * generate a resolver error when a declare symbol shadows with an existing on
   * @param name token for the requested symbol
   * @param symbol collided symbol
   */
  private shadowSymbolHint(
    name: IToken,
    kind: KsSymbolKind,
    symbol: KsSymbol,
  ): Diagnostic {
    return createDiagnostic(
      name,
      `${toCase(CaseKind.pascalcase, KsSymbolKind[symbol.tag])} ${
        symbol.name.lexeme
      } ` + `already exists here. This ${KsSymbolKind[kind]} shadows it.`,
      DiagnosticSeverity.Warning,
      undefined,
      [
        DiagnosticRelatedInformation.create(
          { uri: this.uri, range: symbol.name },
          symbol.name.uri === builtIn
            ? `${symbol.name.lexeme} is a built in ${KsSymbolKind[symbol.tag]}`
            : 'Orignally declared here',
        ),
      ],
    );
  }

  /**
   * generate a resolver error when a declare symbol collides with an existing on
   * @param name token for the requested symbol
   * @param symbol collided symbol
   */
  private localConflictError(name: IToken, symbol: KsSymbol): Diagnostic {
    return createDiagnostic(
      name,
      `${toCase(CaseKind.pascalcase, KsSymbolKind[symbol.tag])} ${
        symbol.name.lexeme
      } already exists.`,
      DiagnosticSeverity.Warning,
      undefined,
      [
        DiagnosticRelatedInformation.create(
          { uri: this.uri, range: symbol.name },
          symbol.name.uri === builtIn
            ? `${symbol.name.lexeme} is a built in ${KsSymbolKind[symbol.tag]}`
            : 'Orignally declared here',
        ),
      ],
    );
  }
}
