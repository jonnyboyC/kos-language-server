import { IKsSymbolTracker, IScope, KsSymbol } from './types';

/**
 * A scope class that contains symbols in the current scope
 */
export class Scope extends Map<string, IKsSymbolTracker> implements IScope {
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
