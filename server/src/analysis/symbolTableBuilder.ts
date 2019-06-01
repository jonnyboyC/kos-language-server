import { empty } from '../utilities/typeGuards';
import { ScopeKind } from '../parser/types';
import { KsVariable } from '../entities/variable';
import {
  EnvironmentNode,
  KsSymbolKind,
  EnvironmentPath,
  KsBaseSymbol,
  UseResult,
} from './types';
import { KsFunction } from '../entities/function';
import { KsLock } from '../entities/lock';
import {
  Range,
  Diagnostic,
  DiagnosticSeverity,
  DiagnosticRelatedInformation,
} from 'vscode-languageserver';
import { ScopePosition } from './scopePosition';
import { mockLogger } from '../utilities/logger';
import { Environment } from './environment';
import { BasicTracker, createSymbolSet } from './tracker';
import { ArgumentType, IFunctionType } from '../typeChecker/types/types';
import { SymbolTable } from './symbolTable';
import { isVariable, isParameter, isLock } from '../entities/entityHelpers';
import {
  rangeToString,
  positionToString,
  rangeBefore,
} from '../utilities/positionUtils';
import { createDiagnostic } from '../utilities/diagnosticsUtils';
import { builtIn } from '../utilities/constants';
import { toCase } from '../utilities/stringUtils';
import { cleanLocation } from '../utilities/clean';
import { Token } from '../entities/token';
import { KsParameter } from '../entities/parameter';
import { isFunction } from 'util';

/**
 * The Symbol table builder is used to declare new symbols and track new symbols
 * in the kerboscript program
 */
export class SymbolTableBuilder {
  /**
   * The global environment for this file
   */
  private readonly global: Environment;

  /**
   * The root environment include the global environment and it's children
   */
  private readonly rootNode: EnvironmentNode;

  /**
   * The active environment node
   */
  private activeNode: EnvironmentNode;

  /**
   * The path in the environment
   */
  private path: EnvironmentPath;

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
    this.global = new Environment();
    this.rootNode = {
      parent: undefined,
      environment: this.global,
      children: [],
      position: { kind: ScopeKind.global },
    };
    this.activeNode = this.rootNode;
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
      this.rootNode,
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
    this.activeNode = this.rootNode;
  }

  /**
   * Get the current scope path TODO consider recomputing active scope
   * when set
   */
  public getPath(): { path: EnvironmentPath; activeScope: EnvironmentNode } {
    return {
      activeScope: this.activeNode,
      path: {
        active: [...this.path.active],
        backTrack: [...this.path.backTrack],
      },
    };
  }

  /**
   * Set the current scope path
   * @param path current path
   * @param activeScope current scope
   */
  public setPath(path: EnvironmentPath, activeScope: EnvironmentNode): void {
    this.path = path;
    this.activeNode = activeScope;
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

    const currentScope = this.activeNode;
    let activeScope: EnvironmentNode;

    // generate a new scope node if it doesn't exist
    if (empty(currentScope.children[next])) {
      activeScope = {
        parent: currentScope,
        environment: new Environment(),
        position: new ScopePosition(range.start, range.end),
        children: [],
      };

      currentScope.children.push(activeScope);

      // or get the existing one
    } else {
      activeScope = currentScope.children[next];
    }

    this.activeNode = activeScope;

    this.logger.verbose(`begin scope at ${positionToString(range.start)}`);

    this.path.active.push(next);
    this.path.backTrack = [...this.path.active];
  }

  /**
   * Pop the current scope off the stack
   */
  public endScope(): void {
    const currentScope = this.activeNode;
    if (empty(currentScope.parent)) {
      throw new Error('Attempted to pop the global scope');
    }

    this.activeNode = currentScope.parent;
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
    return this.scopeDepth() === 1;
  }

  /**
   * Indicate if the current scope if global scope
   */
  public isGlobalScope(): boolean {
    return this.activeNode === this.rootNode;
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

    this.findScopeNodeUnused(this.rootNode, errors);
    return errors;
  }

  /**
   * Use a symbol in the symbol table
   * @param name token for the current symbol
   */
  public useSymbol(name: Token): UseResult {
    const tracker = this.lookup(name.lookup, ScopeKind.global);

    // check if symbols exists
    if (empty(tracker)) {
      const error = createDiagnostic(
        name,
        `Symbol ${name.lexeme} may not exist`,
        DiagnosticSeverity.Warning,
      );
      return { tracker, error };
    }

    const error = this.checkUseSymbol(
      name,
      tracker,
      tracker.declared.symbol.tag,
    );
    return { tracker, error };
  }

  /**
   * Use a variable symbol
   * @param name token for the current variable
   */
  public useVariable(name: Token): Maybe<Diagnostic> {
    const result = this.lookupVariableTracker(name, ScopeKind.global);
    if (result.error) {
      return result.error;
    }

    return this.checkUseSymbol(name, result.tracker, KsSymbolKind.variable);
  }

  /**
   * Use a function symbol
   * @param name token for the current function
   */
  public useFunction(name: Token): Maybe<Diagnostic> {
    const result = this.lookupFunctionTracker(name, ScopeKind.global);
    if (result.error) {
      return result.error;
    }

    return this.checkUseSymbol(name, result.tracker, KsSymbolKind.function);
  }

  /**
   * Use a lock symbol
   * @param name token for the current lock
   */
  public useLock(name: Token): Maybe<Diagnostic> {
    const result = this.lookupLockTracker(name, ScopeKind.global);
    if (result.error) {
      return result.error;
    }

    return this.checkUseSymbol(name, result.tracker, KsSymbolKind.lock);
  }

  /**
   * Use a parameter symbol
   * @param name token for the current parameter
   */
  public useParameter(name: Token): Maybe<Diagnostic> {
    const result = this.lookupParameterTracker(name, ScopeKind.global);
    if (result.error) {
      return result.error;
    }

    return this.checkUseSymbol(name, result.tracker, KsSymbolKind.parameter);
  }

  /**
   * Set a variable symbol
   * @param token token for the variable to set
   */
  public setBinding(token: Token): Maybe<Diagnostic> {
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
    tracker.sets.push(createSymbolSet(token));
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
    token: Token,
    type?: ArgumentType,
  ): Maybe<Diagnostic> {
    const conflictTracker = this.lookupKind(token.lookup, scopeType, KsSymbolKind.variable);

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
    const tracker = new BasicTracker(
      new KsVariable(scopeType, token),
      this.uri,
      type,
    );

    token.tracker = tracker;
    scopeNode.environment.set(token.lookup, KsSymbolKind.variable, tracker);

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
    token: Token,
    requiredParameters: number,
    optionalParameters: number,
    returnValue: boolean,
    type?: IFunctionType,
  ): Maybe<Diagnostic> {
    const conflictTracker = this.lookupKind(token.lookup, scopeType, KsSymbolKind.function);

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
    const tracker = new BasicTracker(
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
    scopeNode.environment.set(token.lookup, KsSymbolKind.function, tracker);

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
    token: Token,
    type?: ArgumentType,
  ): Maybe<Diagnostic> {
    const conflictTracker = this.lookupKind(token.lookup, scopeType, KsSymbolKind.lock);

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
    const tracker = new BasicTracker(
      new KsLock(scopeType, token),
      this.uri,
      type,
    );

    token.tracker = tracker;
    scopeNode.environment.set(token.lookup, KsSymbolKind.lock, tracker);

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
    token: Token,
    defaulted: boolean,
  ): Maybe<Diagnostic> {
    const conflictTracker = this.lookupKind(token.lookup, scopeType, KsSymbolKind.parameter);

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
    const tracker = new BasicTracker(
      new KsParameter(token, defaulted),
      this.uri,
    );

    token.tracker = tracker;
    scopeNode.environment.set(token.lookup, KsSymbolKind.parameter, tracker);

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
    token: Token,
    tracker: Maybe<BasicTracker>,
    symbolType: KsSymbolKind,
  ): Maybe<Diagnostic> {
    // check that variable has already been defined
    if (empty(tracker)) {
      return createDiagnostic(
        token,
        `${toCase(CaseKind.pascalcase, KsSymbolKind[symbolType])} ${
          token.lexeme
        } may not exist.`,
        DiagnosticSeverity.Warning,
      );
    }

    // indicate usage
    token.tracker = tracker;
    tracker.usages.push(cleanLocation(token));
    this.logger.verbose(
      `Use ${toCase(CaseKind.pascalcase, KsSymbolKind[symbolType])} ` +
        `${token.lexeme} at ${rangeToString(token)}`,
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
   * lookup a variable tracker
   * @param token token for the requested variable
   * @param scopeKind requested scope lookup
   */
  public lookupVariableTracker(
    token: Token,
    scopeKind: ScopeKind,
  ): UseResult<KsVariable> {
    const result: UseResult<KsVariable> = {
      tracker: undefined,
      error: undefined,
    };

    const tracker = this.lookup(token.lookup, scopeKind);
    if (empty(tracker)) {
      return result;
    }

    if (isVariable(tracker.declared.symbol)) {
      result.tracker = tracker as BasicTracker<KsVariable>;
    } else {
      result.error = this.wrongTypeError(token, tracker, 'variable');
    }

    return result;
  }

  /**
   * lookup a function tracker
   * @param token token for the requested function
   * @param scopeKind requested scope lookup
   */
  public lookupFunctionTracker(
    token: Token,
    scopeKind: ScopeKind,
  ): UseResult<KsFunction> {
    const result: UseResult<KsFunction> = {
      tracker: undefined,
      error: undefined,
    };

    const tracker = this.lookup(token.lookup, scopeKind);
    if (empty(tracker)) {
      return result;
    }

    if (isFunction(tracker.declared.symbol)) {
      result.tracker = tracker as BasicTracker<KsFunction>;
    } else {
      result.error = this.wrongTypeError(token, tracker, 'function');
    }

    return result;
  }

  /**
   * lookup a lock tracker
   * @param token token for the requested lock
   * @param scopeKind requested scope lookup
   */
  public lookupLockTracker(
    token: Token,
    scopeKind: ScopeKind,
  ): UseResult<KsLock> {
    const result: UseResult<KsLock> = {
      tracker: undefined,
      error: undefined,
    };

    const tracker = this.lookup(token.lookup, scopeKind);
    if (empty(tracker)) {
      return result;
    }

    if (isLock(tracker.declared.symbol)) {
      result.tracker = tracker as BasicTracker<KsLock>;
    } else {
      result.error = this.wrongTypeError(token, tracker, 'lock');
    }

    return result;
  }

  /**
   * lookup a parameter tracker
   * @param token token for the requested parameter
   * @param scopeKind requested scope lookup
   */
  public lookupParameterTracker(
    token: Token,
    scopeKind: ScopeKind,
  ): UseResult<KsParameter> {
    const result: UseResult<KsParameter> = {
      tracker: undefined,
      error: undefined,
    };

    const tracker = this.lookup(token.lookup, scopeKind);
    if (empty(tracker)) {
      return result;
    }

    if (isParameter(tracker.declared.symbol)) {
      result.tracker = tracker as BasicTracker<KsParameter>;
    } else {
      result.error = this.wrongTypeError(token, tracker, 'parameter');
    }

    return result;
  }

  /**
   * lookup a parameter tracker
   * @param token token for the requested parameter
   * @param scopeKind requested scope lookup
   */
  public lookupBindingTracker(
    token: Token,
    scopeKind: ScopeKind,
  ): UseResult<KsParameter | KsVariable> {
    const result: UseResult<KsParameter | KsVariable> = {
      tracker: undefined,
      error: undefined,
    };

    const tracker = this.lookup(token.lookup, scopeKind);
    if (empty(tracker)) {
      return result;
    }

    if (
      isParameter(tracker.declared.symbol) ||
      isVariable(tracker.declared.symbol)
    ) {
      result.tracker = tracker as BasicTracker<KsParameter | KsVariable>;
    } else {
      result.error = this.wrongTypeError(
        token,
        tracker,
        'variable or parameter',
      );
    }

    return result;
  }

  /**
   * Generate a diagnostic when we expect to find a certain type of symbol but
   * find something else instead
   * @param token token for lookup
   * @param tracker found tracker
   * @param expected expected type
   */
  private wrongTypeError(
    token: Token,
    tracker: BasicTracker,
    expected: string,
  ): Diagnostic {
    const foundKind = toCase(
      CaseKind.pascalcase,
      KsSymbolKind[tracker.declared.symbol.tag],
    );

    return createDiagnostic(
      token,
      `Expected a ${expected} but found a ${foundKind} instead`,
      DiagnosticSeverity.Warning,
      undefined,
      [
        DiagnosticRelatedInformation.create(
          { uri: tracker.declared.uri, range: tracker.declared.range },
          `${foundKind} was originally declared here`,
        ),
      ],
    );
  }

  /**
   * Find all unused symbol in a scope node that aren't used and
   * it's children
   * @param node scope node
   * @param errors cumulative errors
   */
  private findScopeNodeUnused(
    node: EnvironmentNode,
    errors: Diagnostic[],
  ): void {
    this.findScopeUnused(node.environment, errors);

    for (const childNode of node.children) {
      this.findScopeNodeUnused(childNode, errors);
    }
  }

  /**
   * Find all unused symbols in an environment that aren't used
   * @param environment environment to check
   * @param errors cumulative errors
   */
  private findScopeUnused(
    environment: Environment,
    errors: Diagnostic[],
  ): void {
    for (const tracker of environment.trackers()) {
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
  private lookup(lookup: string, scopeKind: ScopeKind): Maybe<BasicTracker> {
    const node = this.lookupScopeNode(lookup, scopeKind, (env, lookup) =>
      env.has(lookup),
    );
    return node && node.environment.get(lookup);
  }

  /**
   * Determine if a kind of symbol tracker is in the current path
   * @param lookup token lookup string
   * @param scopeKind scope kind for the lookup local or global
   * @param symbolKind symbol kind variable, function, etc.
   */
  private lookupKind(
    lookup: string,
    scopeKind: ScopeKind,
    symbolKind: KsSymbolKind,
  ): Maybe<BasicTracker> {
    const node = this.lookupScopeNode(lookup, scopeKind, (env, lookup) =>
      env.hasKind(lookup, symbolKind),
    );
    return node && node.environment.getKind(lookup, symbolKind);
  }

  /**
   * Determine if a scope in the current path contains a symbol of interest
   * @param lookup token lookup string
   * @param scopeKind scope kind for the lookup local or global
   */
  private lookupScopeNode(
    lookup: string,
    scopeKind: ScopeKind,
    has: (env: Environment, lookup: string) => boolean,
  ): Maybe<EnvironmentNode> {
    if (scopeKind === ScopeKind.local) {
      return has(this.peekScope(), lookup) ? this.activeNode : undefined;
    }

    let currentScope: Maybe<EnvironmentNode> = this.activeNode;
    while (!empty(currentScope)) {
      if (has(currentScope.environment, lookup)) {
        return currentScope;
      }

      currentScope = currentScope.parent;
    }

    // check child scopes symbol is in another file
    for (const child of this.childSymbolTables) {
      if (child.rootScope.environment.has(lookup)) {
        return child.rootScope;
      }
    }

    return undefined;
  }

  /**
   * Retrieve the appropriate scope
   * @param type scope type global or local
   */
  private selectScopeNode(type: ScopeKind): EnvironmentNode {
    return type === ScopeKind.global ? this.rootNode : this.activeNode;
  }

  /**
   * Retrieve the active environment
   */
  private peekScope(): Environment {
    return this.activeNode.environment;
  }

  /**
   * generate a resolver error when a declare symbol shadows with an existing on
   * @param name token for the requested symbol
   * @param symbol collided symbol
   */
  private shadowSymbolHint(
    name: Token,
    kind: KsSymbolKind,
    symbol: KsBaseSymbol,
  ): Diagnostic {
    return createDiagnostic(
      name,
      `${toCase(CaseKind.pascalcase, KsSymbolKind[symbol.tag])} ${
        symbol.name.lexeme
      } ` + `already exists here. This ${KsSymbolKind[kind]} shadows it.`,
      DiagnosticSeverity.Hint,
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
  private localConflictError(name: Token, symbol: KsBaseSymbol): Diagnostic {
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
