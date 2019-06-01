import { KsBaseSymbol, KsSymbolKind } from './types';
import { BasicTracker } from './tracker';
import { KsVariable } from '../entities/variable';
import { KsParameter } from '../entities/parameter';
import { KsFunction } from '../entities/function';
import { KsLock } from '../entities/lock';

type TrackerKind<T extends KsSymbolKind> =
  T extends KsSymbolKind.variable | KsSymbolKind.parameter
  ? BasicTracker<KsVariable | KsParameter>
  : BasicTracker<KsFunction | KsLock>;

/**
 * A scope class that contains symbols in the current scope
 */
export class Environment {
  private varTable: Map<string, BasicTracker>;
  private funcTable: Map<string, BasicTracker>;

  constructor() {
    this.varTable = new Map();
    this.funcTable = new Map();
  }

  /**
   * Get a value from the environment
   * @param key key lookup
   */
  public get(key: string, kind: KsSymbolKind): Maybe<BasicTracker> {
    switch (kind) {
      case KsSymbolKind.variable:
      case KsSymbolKind.parameter:
        return this.varTable.get(key);
      case KsSymbolKind.function:
      case KsSymbolKind.lock:
        return this.funcTable.get(key);
      default:
        throw new Error('Environment cannot hold suffixes');
    }
  }

  /**
   * See if an environment has a value
   * @param key key lookup
   */
  public has(key: string, kind: KsSymbolKind): boolean {
    switch (kind) {
      case KsSymbolKind.variable:
      case KsSymbolKind.parameter:
        return this.varTable.has(key);
      case KsSymbolKind.function:
      case KsSymbolKind.lock:
        return this.funcTable.has(key);
      default:
        throw new Error('Environment cannot hold suffixes');
    }
  }

  /**
   * Set a value to the environment
   * @param key key lookup
   * @param value basic tracker
   */
  public set<TKind extends KsSymbolKind>(key: string, kind: TKind, value: TrackerKind<TKind>) {
    switch (kind) {
      case KsSymbolKind.variable:
      case KsSymbolKind.parameter:
        return this.varTable.set(key, value);
      case KsSymbolKind.function:
      case KsSymbolKind.lock:
        return this.funcTable.set(key, value);
      default:
        throw new Error('Environment cannot hold suffixes');
    }
  }

  /**
   * Get all trackers in this environment
   */
  public trackers(): IterableIterator<BasicTracker> {
    return this.varTable.values();
  }

  /**
   * All the symbols in this environment
   */
  public symbols(): KsBaseSymbol[] {
    const symbols: KsBaseSymbol[] = [];

    // get variable and parameter symbols
    for (const trackers of this.varTable.values()) {
      symbols.push(trackers.declared.symbol);
    }

    // get function and lock symbols
    for (const trackers of this.funcTable.values()) {
      symbols.push(trackers.declared.symbol);
    }

    return symbols;
  }
}
