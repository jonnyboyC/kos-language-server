import { KsSymbolKind } from '../analysis/types';
import { Token } from './token';

/**
 * A class containing the information of a suffix
 */
export class KsSuffix {
  /**
   * A kerboscript suffix constructor
   * @param name the name of this suffix
   */
  constructor(
    public readonly name: Token,
  )
  { }

  /**
   * What kind of symbol is represented in this case a suffix
   */
  get tag(): KsSymbolKind.suffix  {
    return KsSymbolKind.suffix;
  }
}
