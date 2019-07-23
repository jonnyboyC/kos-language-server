import { EnvironmentNode, GraphNode, KsBaseSymbol, SearchState } from './types';
import { Position } from 'vscode-languageserver';
import { rangeContainsPos } from '../utilities/positionUtils';
import { mockLogger } from '../utilities/logger';
import { empty } from '../utilities/typeGuards';
import { ScopeKind } from '../parser/types';
import { BasicTracker } from './tracker';
import { Environment } from './environment';
import { builtIn } from '../utilities/constants';

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
  public get value(): SymbolTable {
    return this;
  }

  /**
   * get all adjacent nodes to this symbol table
   */
  public get adjacentNodes(): GraphNode<SymbolTable>[] {
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
   * get every symbol in the file
   */
  public globalSymbols(): KsBaseSymbol[] {
    return Array.from(this.rootScope.environment.symbols()).concat(
      this.fileSymbolsDepth(this.rootScope.children),
    );
  }

  /**
   * Get global symbols that match the requested symbol name
   * @param name symbol name
   * @param has function to determine if an environment has the appropriate symbol
   * @param state are we currently looking up or down the dependency tree
   */
  public globalEnvironment(
    name: string,
    state: SearchState = SearchState.dependents,
    has: (env: Environment, lookup: string) => boolean = (env, lookup) =>
      env.has(lookup),
  ): Maybe<Environment> {
    return this.globalEnvironment_(name, has, new Set(), state);
  }

  /**
   * Get global symbols that match the requested symbol name
   * @param name symbol name
   * @param has function to determine if an environment has the appropriate symbol
   * @param checked tables we've already checked
   * @param state are we currently looking up or down the dependency tree
   */
  private globalEnvironment_(
    name: string,
    has: (env: Environment, lookup: string) => boolean,
    checked: Set<SymbolTable>,
    state: SearchState,
  ): Maybe<Environment> {
    if (checked.has(this)) {
      return undefined;
    }

    checked.add(this);

    if (has(this.rootScope.environment, name)) {
      return this.rootScope.environment;
    }

    if (this.uri === builtIn) {
      return undefined;
    }

    if (state === SearchState.dependents) {
      for (const table of this.dependentTables) {
        const result = table.globalEnvironment_(
          name,
          has,
          checked,
          SearchState.dependents,
        );
        if (!empty(result)) {
          return result;
        }
      }
    }

    for (const table of this.dependencyTables) {
      const result = table.globalEnvironment_(
        name,
        has,
        checked,
        SearchState.dependencies,
      );
      if (!empty(result)) {
        return result;
      }
    }

    return undefined;
  }

  /**
   * Get all symbols available at the provide position
   * @param pos position to check
   */
  public scopedSymbols(pos: Position): KsBaseSymbol[] {
    return this.scopedTrackers(pos).map(tracker => tracker.declared.symbol);
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
   * @param nodes nodes to retrieve symbols from
   */
  private fileSymbolsDepth(nodes: EnvironmentNode[]): KsBaseSymbol[] {
    const symbols: KsBaseSymbol[] = [];
    for (const node of nodes) {
      symbols.push(
        ...node.environment.symbols(),
        ...this.fileSymbolsDepth(node.children),
      );
    }

    return symbols;
  }

  /**
   * get all symbol trackers in scope at a position
   * @param pos the position to retrieve symbols from
   */
  private scopedTrackers(pos: Position): BasicTracker[] {
    const scoped = this.scopedTrackersDepth(pos, this.rootScope.children);
    const fileGlobal = Array.from(this.rootScope.environment.trackers());
    const importedGlobals = Array.from(this.dependencyTables.values()).map(
      scope => Array.from(scope.rootScope.environment.trackers()),
    );

    return scoped.concat(fileGlobal, ...importedGlobals);
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
    const scoped = this.scopedTrackerDepth(
      pos,
      this.rootScope.children,
      trackerFilter,
    );
    if (!empty(scoped)) {
      return scoped;
    }

    const fileGlobal = this.rootScope.environment.trackers();
    const importedGlobals = Array.from(this.dependencyTables.values()).map(
      scope => Array.from(scope.rootScope.environment.trackers()),
    );

    const [match] = fileGlobal.concat(...importedGlobals).filter(trackerFilter);

    return match;
  }

  /**
   * recursively move up scopes to find most relevant symbols
   * @param pos position to search
   * @param nodes scope nodes to check
   */
  private scopedTrackersDepth(
    pos: Position,
    nodes: EnvironmentNode[],
  ): BasicTracker[] {
    for (const node of nodes) {
      const { position } = node;
      switch (position.kind) {
        // if global it is available
        case ScopeKind.global:
          return this.scopedTrackersDepth(pos, node.children).concat(
            Array.from(node.environment.trackers()),
          );
        // if the scope has a real position check if we're in the bounds
        case ScopeKind.local:
          if (rangeContainsPos(position, pos)) {
            return this.scopedTrackersDepth(pos, node.children).concat(
              Array.from(node.environment.trackers()),
            );
          }
          break;
      }
    }

    return [];
  }

  /**
   * recursively move up scope for more relevant symbols
   * @param pos position to search
   * @param nodes scope nodes to check
   * @param trackerFilter filter for acceptable symbols
   */
  private scopedTrackerDepth(
    pos: Position,
    nodes: EnvironmentNode[],
    trackerFilter: (x: BasicTracker) => boolean,
  ): Maybe<BasicTracker> {
    let childSymbol: Maybe<BasicTracker> = undefined;

    for (const node of nodes) {
      const { position } = node;
      switch (position.kind) {
        // if global it is available
        case ScopeKind.global:
          childSymbol = this.scopedTrackerDepth(
            pos,
            node.children,
            trackerFilter,
          );
          if (!empty(childSymbol)) {
            return childSymbol;
          }

          const currentSymbols = Array.from(node.environment.trackers()).filter(
            trackerFilter,
          );
          if (currentSymbols.length === 1) {
            return currentSymbols[0];
          }
          break;
        // if the scope has a real position check if we're in the bounds
        case ScopeKind.local:
          if (rangeContainsPos(position, pos)) {
            childSymbol = this.scopedTrackerDepth(
              pos,
              node.children,
              trackerFilter,
            );
            if (!empty(childSymbol)) {
              return childSymbol;
            }

            const currentSymbols = Array.from(
              node.environment.trackers(),
            ).filter(trackerFilter);
            if (currentSymbols.length === 1) {
              return currentSymbols[0];
            }
          }
          break;
      }
    }

    return undefined;
  }
}
