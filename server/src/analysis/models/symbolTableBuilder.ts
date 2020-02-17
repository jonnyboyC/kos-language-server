import { empty } from '../../utilities/typeGuards';
import { ScopeKind } from '../../parser/types';
import { KsVariable } from '../../models/variable';
import {
  EnvironmentNode,
  KsSymbolKind,
  EnvironmentPath,
  KsBaseSymbol,
  UseResult,
  SearchState,
} from '../types';
import { KsFunction } from '../../models/function';
import { KsLock } from '../../models/lock';
import {
  Range,
  Diagnostic,
  DiagnosticSeverity,
  DiagnosticRelatedInformation,
  Location,
} from 'vscode-languageserver';
import { ScopePosition } from './scopePosition';
import { mockLogger } from '../../models/logger';
import { Environment } from './environment';
import { BasicTracker, createSymbolSet } from './tracker';
import { SymbolTable } from './symbolTable';
import {
  isVariable,
  isParameter,
  isLock,
  isFunction,
} from '../../utilities/entityUtils';
import {
  rangeToString,
  positionToString,
  rangeBefore,
} from '../../utilities/positionUtils';
import {
  createDiagnostic,
  DIAGNOSTICS,
} from '../../utilities/diagnosticsUtils';
import { builtIn } from '../../utilities/constants';
import { toCase } from '../../utilities/stringUtils';
import { cleanLocation } from '../../utilities/clean';
import { Token } from '../../models/token';
import { KsParameter } from '../../models/parameter';
import { IType } from '../../typeChecker/types';

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
   * A cache from global symbols to their environment
   */
  private globalSymbolEnvironment: Map<string, Environment>;

  /**
   * A set of symbols tables that are dependencies of this table
   */
  public dependencyTables: Set<SymbolTable>;

  /**
   * A set of symbol tables that are dependent on this table
   */
  public dependentTables: Set<SymbolTable>;

  /**
   * logger class to reporting errors and information
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
      range: { kind: ScopeKind.global },
    };
    this.activeNode = this.rootNode;
    this.path = {
      active: [],
      backTrack: [],
    };
    this.globalSymbolEnvironment = new Map();
    this.dependencyTables = new Set();
    this.dependentTables = new Set();
  }

  /**
   * Generate a symbol table. This method will update dependent tables
   * if and old version of the symbol table exists
   */
  public build(): SymbolTable {
    const table = new SymbolTable(
      this.rootNode,
      this.dependencyTables,
      this.dependentTables,
      this.uri,
      this.logger,
    );

    // add self as dependency to dependent tables
    for (const dependentTable of table.dependentTables) {
      dependentTable.dependencyTables.add(table);
    }

    return table;
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
   * Add a dependency symbol table to this symbol table builder
   * @param symbolTable the dependency symbol table
   */
  public linkDependency(symbolTable: SymbolTable): void {
    this.dependencyTables.add(symbolTable);
  }

  /**
   * Add a dependent symbol table to this symbol table builder
   * @param symbolTable the dependent symbol table
   */
  public linkDependent(symbolTable: SymbolTable): void {
    this.dependentTables.add(symbolTable);
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
        range: new ScopePosition(range.start, range.end),
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

    if (currentScope.range.kind === ScopeKind.local) {
      this.logger.verbose(
        `end scope at ${positionToString(currentScope.range.end)}`,
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
        DIAGNOSTICS.SYMBOL_MAY_NOT_EXIST,
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
        DIAGNOSTICS.SYMBOL_MAY_NOT_EXIST,
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
   * @param scopeKind the requested scope type
   * @param token token for the requested variable
   * @param type type to declare variable as
   */
  public declareVariable(
    scopeKind: ScopeKind,
    token: Token,
    range: Range,
    type?: IType,
  ): Maybe<Diagnostic> {
    const conflictTracker = this.lookupKind(
      token.lookup,
      scopeKind,
      KsSymbolKind.variable,
    );

    // check if variable has already been defined
    if (!empty(conflictTracker)) {
      return this.localConflictError(token, conflictTracker.declared.symbol);
    }

    let diagnostic: Maybe<Diagnostic>;

    // if global we can't shadow
    if (scopeKind === ScopeKind.global) {
      diagnostic = undefined;

      // if local check for shadowing hints
    } else {
      const shadowTracker = this.lookupKind(
        token.lookup,
        ScopeKind.global,
        KsSymbolKind.variable,
      );
      diagnostic = empty(shadowTracker)
        ? undefined
        : this.shadowSymbolHint(
            token,
            KsSymbolKind.variable,
            shadowTracker.declared.symbol,
          );
    }

    const scopeNode = this.selectScopeNode(scopeKind);
    const tracker = new BasicTracker(
      new KsVariable(scopeKind, token, range),
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
   * @param scopeKind the requested scope type
   * @param token token for the requested function
   * @param requiredParameters required parameters for the function
   * @param optionalParameters optional parameters for the function
   * @param returnValue does the function have a return type
   * @param type type to declare function as
   */
  public declareFunction(
    scopeKind: ScopeKind,
    token: Token,
    range: Range,
    requiredParameters: number,
    optionalParameters: number,
    returnValue: boolean,
    type?: IType,
  ): Maybe<Diagnostic> {
    const conflictTracker = this.lookupKind(
      token.lookup,
      scopeKind,
      KsSymbolKind.function,
    );

    // check if variable has already been defined
    if (!empty(conflictTracker)) {
      return this.localConflictError(token, conflictTracker.declared.symbol);
    }

    let diagnostic: Maybe<Diagnostic>;

    // if global we can't shadow
    if (scopeKind === ScopeKind.global) {
      diagnostic = undefined;

      // if local check for shadowing hints
    } else {
      const shadowTracker = this.lookupKind(
        token.lookup,
        ScopeKind.global,
        KsSymbolKind.function,
      );
      diagnostic = empty(shadowTracker)
        ? undefined
        : this.shadowSymbolHint(
            token,
            KsSymbolKind.function,
            shadowTracker.declared.symbol,
          );
    }

    const scopeNode = this.selectScopeNode(scopeKind);
    const tracker = new BasicTracker(
      new KsFunction(
        scopeKind,
        token,
        range,
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
   * @param scopeKind the requested scope type
   * @param token token for the requested lock
   * @param type type to declare lock as
   */
  public declareLock(
    scopeKind: ScopeKind,
    token: Token,
    range: Range,
    type?: IType,
  ): Maybe<Diagnostic> {
    const conflictTracker = this.lookupKind(
      token.lookup,
      scopeKind,
      KsSymbolKind.lock,
    );

    // check if lock has already been defined
    if (!empty(conflictTracker)) {
      return this.localConflictError(token, conflictTracker.declared.symbol);
    }

    let diagnostic: Maybe<Diagnostic>;

    // if global we can't shadow
    if (scopeKind === ScopeKind.global) {
      diagnostic = undefined;

      // if local check for shadowing hints
    } else {
      const shadowTracker = this.lookupKind(
        token.lookup,
        ScopeKind.global,
        KsSymbolKind.lock,
      );
      diagnostic = empty(shadowTracker)
        ? undefined
        : this.shadowSymbolHint(
            token,
            KsSymbolKind.lock,
            shadowTracker.declared.symbol,
          );
    }

    const scopeNode = this.selectScopeNode(scopeKind);
    const tracker = new BasicTracker(
      new KsLock(scopeKind, token, range),
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
   * @param scopeKind the requested scope type
   * @param token token for the requested parameter
   * @param defaulted is the parameter defaulted
   */
  public declareParameter(
    scopeKind: ScopeKind,
    token: Token,
    range: Range,
  ): Maybe<Diagnostic> {
    const conflictTracker = this.lookupKind(
      token.lookup,
      scopeKind,
      KsSymbolKind.parameter,
    );

    // check if variable has already been defined
    if (!empty(conflictTracker)) {
      return this.localConflictError(token, conflictTracker.declared.symbol);
    }

    let diagnostic: Maybe<Diagnostic>;

    // if global we can't shadow
    if (scopeKind === ScopeKind.global) {
      diagnostic = undefined;

      // if local check for shadowing hints
    } else {
      const shadowTracker = this.lookupKind(
        token.lookup,
        ScopeKind.global,
        KsSymbolKind.parameter,
      );
      diagnostic = empty(shadowTracker)
        ? undefined
        : this.shadowSymbolHint(
            token,
            KsSymbolKind.parameter,
            shadowTracker.declared.symbol,
          );
    }

    const scopeNode = this.selectScopeNode(scopeKind);
    const tracker = new BasicTracker(new KsParameter(token, range), this.uri);

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
        `${toCase(CaseKind.pascalCase, KsSymbolKind[symbolType])} ${
          token.lexeme
        } may not exist.`,
        DiagnosticSeverity.Warning,
        DIAGNOSTICS.SYMBOL_MAY_NOT_EXIST,
      );
    }

    // indicate usage
    token.tracker = tracker;
    tracker.usages.push(cleanLocation(token));
    this.logger.verbose(
      `Use ${toCase(CaseKind.pascalCase, KsSymbolKind[symbolType])} ` +
        `${token.lexeme} at ${rangeToString(token)}`,
    );

    // check if a variable may not be defined in a runtime situation
    // functions will always be available because they are executed
    // during a pre pass
    if (
      rangeBefore(token, tracker.declared.range.start) &&
      tracker.declared.symbol.tag !== KsSymbolKind.function
    ) {
      return createDiagnostic(
        token,
        `${toCase(CaseKind.pascalCase, KsSymbolKind[symbolType])} ${
          token.lexeme
        } may not exist at script runtime.`,
        DiagnosticSeverity.Hint,
        DIAGNOSTICS.SYMBOL_MAY_NOT_RUNTIME_EXIST,
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
      CaseKind.pascalCase,
      KsSymbolKind[tracker.declared.symbol.tag],
    );

    return createDiagnostic(
      token,
      `Expected a ${expected} but found a ${foundKind} instead`,
      DiagnosticSeverity.Warning,
      DIAGNOSTICS.SYMBOL_WRONG_KIND,
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
          if (
            tracker.declared.symbol.scope === ScopeKind.local &&
            tracker.usages.length === 0
          ) {
            errors.push(this.createUnusedDiagnostic(tracker));
          }
          break;
        case KsSymbolKind.parameter:
          if (tracker.usages.length === 0) {
            errors.push(this.createUnusedDiagnostic(tracker));
          }
          break;
        case KsSymbolKind.lock:
          if (!tracker.declared.symbol.cooked && tracker.usages.length === 0) {
            errors.push(this.createUnusedDiagnostic(tracker));
          }
          break;
        case KsSymbolKind.variable:
          if (tracker.usages.length === 0) {
            errors.push(this.createUnusedDiagnostic(tracker));
          }
          break;
        default:
          throw new Error('Unknown symbol found');
      }
    }
  }

  /**
   * Create a diagnostics for a symbol has been unused
   * @param tracker symbol tracker tha has been unused
   */
  private createUnusedDiagnostic(tracker: BasicTracker) {
    const { symbol } = tracker.declared;
    const { tag, name } = symbol;

    let level: DiagnosticSeverity = DiagnosticSeverity.Warning;
    let usedString = 'was not used.';
    let scopeString = 'Local';
    let code: ValueOf<typeof DIAGNOSTICS> = DIAGNOSTICS.SYMBOL_UNUSED;

    if (isLock(symbol) || isVariable(symbol) || isFunction(symbol)) {
      if (symbol.scope === ScopeKind.global) {
        level = DiagnosticSeverity.Information;
        usedString = 'was not used locally.';
        scopeString = 'Global';
        code = DIAGNOSTICS.SYMBOL_UNUSED_LOCALLY;
      }
    }

    const kindString = toCase(CaseKind.lowerCase, KsSymbolKind[tag]);

    return createDiagnostic(
      name,
      `${scopeString} ${kindString} ${name.lexeme} ${usedString}`,
      level,
      code,
    );
  }

  /**
   * Determine if a symbol tracker is in the current path
   * @param lookup token lookup string
   * @param scopeKind scope kind for the lookup local or global
   */
  private lookup(lookup: string, scopeKind: ScopeKind): Maybe<BasicTracker> {
    const environment = this.lookupEnvironment(
      lookup,
      scopeKind,
      (env, lookup) => env.has(lookup),
    );
    return environment && environment.get(lookup);
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
    const environment = this.lookupEnvironment(
      lookup,
      scopeKind,
      (env, lookup) => env.hasKind(lookup, symbolKind),
    );
    return environment && environment.getKind(lookup, symbolKind);
  }

  /**
   * Determine if a scope in the current path contains a symbol of interest
   * @param lookup token lookup string
   * @param scopeKind scope kind for the lookup local or global
   */
  private lookupEnvironment(
    lookup: string,
    scopeKind: ScopeKind,
    has: (env: Environment, lookup: string) => boolean,
  ): Maybe<Environment> {
    if (scopeKind === ScopeKind.local) {
      return has(this.peekScope(), lookup)
        ? this.activeNode.environment
        : undefined;
    }

    // progress current set of scopes
    let currentScope: Maybe<EnvironmentNode> = this.activeNode;
    while (!empty(currentScope)) {
      if (has(currentScope.environment, lookup)) {
        return currentScope.environment;
      }

      currentScope = currentScope.parent;
    }

    const key = `${lookup}%${scopeKind}`;
    const found = this.globalSymbolEnvironment.get(key);

    if (!empty(found)) {
      return found;
    }

    const searched = new Set<SymbolTable>();

    // check dependency tables for the symbol
    for (const child of this.dependencyTables) {
      const environment = child.globalEnvironment(
        lookup,
        SearchState.dependencies,
        searched,
        has,
      );
      if (!empty(environment)) {
        this.globalSymbolEnvironment.set(key, environment);
        return environment;
      }
    }

    // check dependent tables for the symbol
    for (const child of this.dependentTables) {
      const environment = child.globalEnvironment(
        lookup,
        SearchState.dependents,
        searched,
        has,
      );
      if (!empty(environment)) {
        this.globalSymbolEnvironment.set(key, environment);
        return environment;
      }
    }

    // not found
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
      `${toCase(CaseKind.pascalCase, KsSymbolKind[symbol.tag])} ${
        symbol.name.lexeme
      } ` + `already exists here. This ${KsSymbolKind[kind]} shadows it.`,
      DiagnosticSeverity.Hint,
      DIAGNOSTICS.SYMBOL_SHADOWS,
      [this.symbolConflictInfo(symbol)],
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
      `${toCase(CaseKind.pascalCase, KsSymbolKind[symbol.tag])} ${
        symbol.name.lexeme
      } already exists.`,
      DiagnosticSeverity.Warning,
      DIAGNOSTICS.SYMBOL_CONFLICT,
      [this.symbolConflictInfo(symbol)],
    );
  }

  /**
   * Create a related information diagnostics to point to the location
   * of the original definition
   * @param symbol symbol in conflict
   */
  private symbolConflictInfo(
    symbol: KsBaseSymbol,
  ): DiagnosticRelatedInformation {
    return DiagnosticRelatedInformation.create(
      this.symbolConflictLocation(symbol),
      this.symbolConflictMessage(symbol),
    );
  }

  /**
   * Create a conflict message for a related diagnostic
   * @param symbol symbol in conflict
   */
  private symbolConflictMessage(symbol: KsBaseSymbol): string {
    return symbol.name.uri === builtIn
      ? `${symbol.name.lexeme} is a built in ${KsSymbolKind[symbol.tag]}`
      : 'Originally declared here';
  }

  /**
   * Determine the location of the conflicted symbol. With an exception for
   * built in symbols
   * @param symbol symbol in conflict
   */
  private symbolConflictLocation(symbol: KsBaseSymbol): Location {
    return symbol.name.uri === builtIn
      ? { uri: this.uri, range: symbol.name }
      : { uri: symbol.name.uri, range: symbol.name };
  }
}
