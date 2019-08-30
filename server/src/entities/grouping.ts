import { KsSymbolKind } from '../analysis/types';

/**
 * A class containing the information of a suffix
 */
export class KsGrouping {
  /**
   * A kerboscript suffix constructor
   * @param name the name of this suffix
   */
  constructor(public readonly name: string) {}

  /**
   * What kind of symbol is represented in this case a grouping
   */
  get tag(): KsSymbolKind.grouping {
    return KsSymbolKind.grouping;
  }
}
