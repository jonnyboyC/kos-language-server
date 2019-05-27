import { KsSymbol } from './types';
import { BasicTracker } from './tracker';

/**
 * A scope class that contains symbols in the current scope
 */
export class Environment extends Map<string, BasicTracker> {
  constructor() {
    super();
  }

  /**
   * All the symbols in this scope
   */
  public symbols(): KsSymbol[] {
    const symbols: KsSymbol[] = [];

    for (const trackers of this.values()) {
      symbols.push(trackers.declared.symbol);
    }

    return symbols;
  }
}
