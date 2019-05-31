import { KsBaseSymbol } from './types';
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
  public get(key: string): Maybe<BasicTracker> {
    return this.map.get(key);
  }

  /**
   * See if an environment has a value
   * @param key key lookup
   */
  public has(key: string): boolean {
    return this.map.has(key);
  }

  /**
   * Set a value to the environment
   * @param key key lookup
   * @param value basic tracker
   */
  public set(key: string, value: BasicTracker) {
    this.map.set(key, value);
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
}
