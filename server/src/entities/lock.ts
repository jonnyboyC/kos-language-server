import { ScopeKind } from '../parser/types';
import { KsSymbolKind } from '../analysis/types';
import { Token } from './token';

/**
 * A class containing the information of a lock
 */
export class KsLock {
  /**
   * A kerboscript lock constructor
   * @param scope the scope of this lock
   * @param name the name of this lock
   */
  constructor(
    public readonly scope: ScopeKind,
    public readonly name: Token,
  )
  { }

  /**
   * Is this lock "cooked"
   */
  get cooked(): boolean {
    switch (this.name.lookup) {
      case 'throttle':
      case 'steering':
      case 'wheelthrottle':
      case 'wheelsteering':
        return true;
      default:
        return false;
    }
  }

  /**
   * What kind of symbol is represented in this case a lock
   */
  get tag(): KsSymbolKind.lock {
    return KsSymbolKind.lock;
  }
}
