import { KsSymbolKind } from '../analysis/types';
import { Token } from './token';

/**
 * A class containing the information of a parameter
 */
export class KsParameter {
  /**
   * A kerboscript parameter constructor
   * @param name the name of this parameter
   * @param defaulted is this parameter defaulted
   */
  constructor(
    public readonly name: Token,
    public readonly defaulted: boolean,
  )
  { }

  /**
   * What kind of symbol is represented in this case a parameter
   */
  get tag(): KsSymbolKind.parameter {
    return KsSymbolKind.parameter;
  }
}
