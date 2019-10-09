import { EnvironmentNode, KsBaseSymbol, SearchState } from '../types';
import { Position } from 'vscode-languageserver';
import { rangeContainsPos } from '../../utilities/positionUtils';
import { mockLogger } from '../../models/logger';
import { empty } from '../../utilities/typeGuards';
import { ScopeKind } from '../../parser/types';
import { BasicTracker } from './tracker';
import { Environment } from './environment';
import { builtIn } from '../../utilities/constants';

/**
 * The Symbol table is used to update and retrieve symbol type information
 */
export class SymbolTable implements GraphNode<SymbolTable> {
  /**
   * The root scope of this files symbol table
   */
  public readonly rootScope: EnvironmentNode;

  /**
   * The parent symbol tables to this symbol table
   */
  public readonly dependentTables: Set<SymbolTable>;

  /**
   * the child symbol tables to this symbol table
   */
  public readonly dependencyTables: Set<SymbolTable>;

  /**
   * file uri for this symbol table
   */
  public readonly uri: string;

  /**
   * the symbol table logger
   */
  public readonly logger: ILogger;

  /**
   * construct a symbol table. typically this is done by the symbol table builder
   * @param rootScope the root scope of the symbol table
   * @param dependencyTables tables that this table is dependent on
   * @param dependentTable tables that are dependent on this table
   * @param uri the file uri for this symbol table
   * @param logger a logger for the symbol table
   */
  constructor(
    rootScope: EnvironmentNode,
    dependencyTables: Set<SymbolTable>,
    dependentTable: Set<SymbolTable>,
    uri: string,
    logger: ILogger = mockLogger,
  ) {
    this.rootScope = rootScope;
    this.dependencyTables = dependencyTables;
    this.dependentTables = dependentTable;
    this.uri = uri;
    this.logger = logger;

    for (const symbolTable of dependencyTables) {
      symbolTable.dependentTables.add(this);
    }
  }

  /**
   * return itself for the graph interface
   */
  public value(): SymbolTable {
    return this;
  }

  /**
   * get all adjacent nodes to this symbol table
   */
  public adjacentNodes(): GraphNode<SymbolTable>[] {
    return Array.from(this.dependencyTables);
  }

  /**
   * should be called when the associated file is closed. It will remove it's reference
   * if another symbol table doesn't reference it
   */
  public closeSelf(): void {
    // remove children if no parents
    if (this.dependentTables.size === 0) {
      // remove references from child scopes
      for (const child of this.dependencyTables) {
        child.dependentTables.delete(this);
      }

      // clear own references
      this.dependencyTables.clear();
    }
  }

  /**
   * This should be called when the associated symbol table is to be deleted
   */
  public removeSelf(): void {
    // remove references from parent scopes
    for (const parent of this.dependentTables) {
      parent.dependencyTables.delete(this);
    }

    // remove references from child scopes
    for (const child of this.dependencyTables) {
      child.dependentTables.delete(this);
    }

    // clear own references
    this.dependencyTables.clear();
    this.dependentTables.clear();
  }

  /**
   * get every symbol in this file
   */
  public allSymbols(): KsBaseSymbol[] {
    const symbols: KsBaseSymbol[] = [];
    this.fileSymbolsDepth(symbols, this.rootScope);
    return symbols;
  }

  /**
   * Get global symbols that match the requested symbol name
   * @param name symbol name
   * @param has function to determine if an environment has the appropriate symbol
   * @param state are we currently looking up or down the dependency tree
   */
  public globalEnvironment(
    name: string,
    state: SearchState,
    searched: Set<SymbolTable>,
    has: (env: Environment, lookup: string) => boolean = (env, lookup) =>
      env.has(lookup),
  ): Maybe<Environment> {
    for (const environment of this.importedEnvironments_(searched, state)) {
      if (has(environment, name)) {
        return environment;
      }
    }
    return undefined;
  }

  /**
   * Get all symbols locally scoped available at the provide position
   * @param pos position to check
   */
  public scopedSymbols(pos: Position): KsBaseSymbol[] {
    return this.scopedTrackers(pos).map(tracker => tracker.declared.symbol);
  }

  /**
   * Get all imported symbols relative to this script
   */
  public importedSymbols(): KsBaseSymbol[] {
    return [...this.importedTrackers()].map(tracker => tracker.declared.symbol);
  }

  /**
   * Get a tracker for a given symbol under a filter condition and position
   * @param pos position to check
   * @param name name of the symbol
   * @param symbolFilter filter function for the symbol
   */
  public scopedNamedTracker(
    pos: Position,
    name: string,
    symbolFilter?: (x: BasicTracker) => boolean,
  ): Maybe<BasicTracker> {
    // our base filter is to match the symbol lexeme
    const baseFilter = (trackers: BasicTracker) =>
      trackers.declared.symbol.name.lookup === name;

    // our compound filter checks for any and the other requested filtering operations
    const compoundFilter = empty(symbolFilter)
      ? baseFilter
      : (trackers: BasicTracker) =>
          baseFilter(trackers) && symbolFilter(trackers);

    return this.scopedTracker(pos, compoundFilter);
  }

  /**
   * recursively move up the scope to get every file symbol
   * @param symbols symbols found so far
   * @param node current environment node
   */
  private fileSymbolsDepth(
    symbols: KsBaseSymbol[],
    node: EnvironmentNode,
  ): void {
    symbols.push(...node.environment.symbols());

    for (const child of node.children) {
      this.fileSymbolsDepth(symbols, child);
    }
  }

  /**
   * get all symbol trackers locally in scope at a position
   * @param pos the position to retrieve symbols from
   */
  private scopedTrackers(pos: Position): BasicTracker[] {
    const trackers: BasicTracker[] = [];

    this.scopedTrackersDepth(trackers, pos, this.rootScope);
    // trackers.push(...this.importedTrackers());

    return trackers;
  }

  /**
   * get a symbol tracker under the conditions of a provided filter
   * @param pos the position to check for symbols
   * @param trackerFilter the tracker filter
   */
  private scopedTracker(
    pos: Position,
    trackerFilter: (x: BasicTracker) => boolean = _ => true,
  ): Maybe<BasicTracker> {
    const tracker = this.scopedTrackerDepth(pos, this.rootScope, trackerFilter);
    if (!empty(tracker)) {
      return tracker;
    }

    // search all imported trackers
    for (const tracker of this.importedTrackers()) {
      if (trackerFilter(tracker)) {
        return tracker;
      }
    }

    return undefined;
  }

  /**
   * recursively move up scopes to find most relevant symbols
   * @param trackers basic trackers found so far
   * @param pos position to search
   * @param nodes scope nodes to check
   */
  private scopedTrackersDepth(
    trackers: BasicTracker[],
    pos: Position,
    node: EnvironmentNode,
  ): void {
    const { range } = node;

    switch (range.kind) {
      case ScopeKind.global:
        // if global scope we're in scope
        trackers.push(...node.environment.trackers());
        for (const child of node.children) {
          this.scopedTrackersDepth(trackers, pos, child);
        }
        break;
      case ScopeKind.local:
        // if local scope check that we're in range
        if (rangeContainsPos(range, pos)) {
          trackers.push(...node.environment.trackers());
          for (const child of node.children) {
            this.scopedTrackersDepth(trackers, pos, child);
          }
          break;
        }
    }
  }

  /**
   * recursively move up scope for more relevant symbols
   * @param pos position to search
   * @param nodes scope nodes to check
   * @param trackerFilter filter for acceptable symbols
   */
  private scopedTrackerDepth(
    pos: Position,
    node: EnvironmentNode,
    trackerFilter: (x: BasicTracker) => boolean,
  ): Maybe<BasicTracker> {
    let childSymbol: Maybe<BasicTracker> = undefined;

    const { range } = node;
    switch (range.kind) {
      // if global it is available
      case ScopeKind.global:
        for (const child of node.children) {
          childSymbol = this.scopedTrackerDepth(pos, child, trackerFilter);
          if (!empty(childSymbol)) {
            return childSymbol;
          }
        }

        for (const tracker of node.environment.trackers()) {
          if (trackerFilter(tracker)) {
            return tracker;
          }
        }

        break;
      // if the scope has a real position check if we're in the bounds
      case ScopeKind.local:
        if (rangeContainsPos(range, pos)) {
          for (const child of node.children) {
            childSymbol = this.scopedTrackerDepth(pos, child, trackerFilter);
            if (!empty(childSymbol)) {
              return childSymbol;
            }
          }

          for (const tracker of node.environment.trackers()) {
            if (trackerFilter(tracker)) {
              return tracker;
            }
          }
        }
        break;
    }

    return undefined;
  }

  /**
   * Search all for all imported symbol trackers that are accessible from this
   * environment
   */
  private *importedTrackers(): IterableIterator<BasicTracker> {
    for (const environment of this.importedEnvironments()) {
      yield* environment.trackers();
    }
  }

  /**
   * Search all accessible environments from this environment
   * @param checked what environments have already been checked
   * @param state what is the current search state
   */
  private *importedEnvironments(): IterableIterator<Environment> {
    const checked = new Set<SymbolTable>([this]);

    // If we're currently looking up the dependency tree we can continue doing so
    for (const dependent of this.dependentTables) {
      yield* dependent.importedEnvironments_(checked, SearchState.dependents);
    }

    // check dependencies
    for (const dependency of this.dependencyTables) {
      yield* dependency.importedEnvironments_(
        checked,
        SearchState.dependencies,
      );
    }
  }

  /**
   * Search all accessible environments from this environment
   * @param checked what environments have already been checked
   * @param state what is the current search state
   */
  private *importedEnvironments_(
    checked: Set<SymbolTable>,
    state: SearchState,
  ): IterableIterator<Environment> {
    // return if we already checked this environment
    if (checked.has(this)) {
      return;
    }
    checked.add(this);

    yield this.rootScope.environment;

    // don't check any further if built in
    if (this.uri === builtIn) {
      return;
    }

    // If we're currently looking up the dependency tree we can continue doing so
    if (state === SearchState.dependents) {
      for (const dependent of this.dependentTables) {
        yield* dependent.importedEnvironments_(checked, SearchState.dependents);
      }
    }

    // check dependencies
    for (const dependency of this.dependencyTables) {
      yield* dependency.importedEnvironments_(
        checked,
        SearchState.dependencies,
      );
    }
  }
}
