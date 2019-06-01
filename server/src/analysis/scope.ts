import { KsBaseSymbol, KsSymbolKind } from './types';
import { BasicTracker } from './tracker';

/**
 * A scope class that contains symbols in the current scope
 */
export class Environment {
  private map: Map<string, BasicTracker>;

  constructor() {
    this.map = new Map();
  }

  /**
   * Get a value from the environment
   * @param key key lookup
   */
  public get(key: string, kind: KsSymbolKind): Maybe<BasicTracker> {
    return this.map.get(this.mangle(key, kind));
  }

  /**
   * See if an environment has a value
   * @param key key lookup
   */
  public has(key: string, kind: KsSymbolKind): boolean {
    return this.map.has(this.mangle(key, kind));
  }

  /**
   * Set a value to the environment
   * @param key key lookup
   * @param value basic tracker
   */
  public set(key: string, kind: KsSymbolKind, value: BasicTracker) {
    this.map.set(this.mangle(key, kind), value);
  }

  /**
   * Get all trackers in this environment
   */
  public trackers(): IterableIterator<BasicTracker> {
    return this.map.values();
  }

  /**
   * All the symbols in this environment
   */
  public symbols(): KsBaseSymbol[] {
    const symbols: KsBaseSymbol[] = [];

    for (const trackers of this.map.values()) {
      symbols.push(trackers.declared.symbol);
    }

    return symbols;
  }

  /**
   * Mangle the key to replicate kOS behavior
   * @param key key lookup
   * @param kind symbol kind
   */
  private mangle(key: string, kind: KsSymbolKind): string {
    switch (kind) {
      case KsSymbolKind.function:
      case KsSymbolKind.lock:
        return `*${key}*`;
      case KsSymbolKind.parameter:
      case KsSymbolKind.variable:
        return key;
      default:
        throw new Error('Suffixes should never be set in a symbol table');
    }
  }
}
