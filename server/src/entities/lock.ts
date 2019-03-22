import { ScopeType } from '../parser/types';
import { IToken } from './types';
import { KsSymbolKind } from '../analysis/types';

export class KsLock {
  constructor(
    public readonly scope: ScopeType,
    public readonly name: IToken,
  )
  { }

  get cooked(): boolean {
    switch (this.name.lexeme) {
      case 'throttle':
      case 'steering':
      case 'wheelthrottle':
      case 'wheelsteering':
        return true;
      default:
        return false;
    }
  }

  get tag(): KsSymbolKind.lock {
    return KsSymbolKind.lock;
  }
}
