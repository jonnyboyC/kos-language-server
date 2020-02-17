import { ScopeKind } from '../parser/types';
import { KsSymbolKind } from '../analysis/types';
import { Token } from './token';
import { Range } from 'vscode-languageserver';

/**
 * A class containing the information of a lock
 */
export class KsLock {
  /**
   * A kerboscript lock constructor
   * @param scope the scope of this lock
   * @param name the name of this lock
   * @param range the range of this lock
   */
  constructor(
    public readonly scope: ScopeKind,
    public readonly name: Token,
    public readonly range: Range,
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
