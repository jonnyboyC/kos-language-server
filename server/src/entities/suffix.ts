import { KsSymbolKind } from '../analysis/types';

/**
 * A class containing the information of a suffix
 */
export class KsSuffix {
  /**
   * A kerboscript suffix constructor
   * @param name the name of this suffix
   */
  constructor(
    public readonly name: string,
  )
  { }

  /**
   * What kind of symbol is represented in this case a suffix
   */
  get tag(): KsSymbolKind.suffix  {
    return KsSymbolKind.suffix;
  }
}
