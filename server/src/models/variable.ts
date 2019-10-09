import { ScopeKind } from '../parser/types';
import { KsSymbolKind } from '../analysis/types';
import { Token } from './token';

/**
 * A class containing the information of a variable
 */
export class KsVariable {
  /**
   * A kerboscript variable constructor
   * @param scope the scope of this variable
   * @param name the name of this variable
   */
  constructor(
    public readonly scope: ScopeKind,
    public readonly name: Token,
  )
  { }

  /**
   * What kind of symbol is represented in this case a variable
   */
  get tag(): KsSymbolKind.variable  {
    return KsSymbolKind.variable;
  }
}
