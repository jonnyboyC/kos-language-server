import { LockState } from '../analysis/types';
import { ScopeType } from '../parser/types';
import { IToken } from './types';

export class KsLock {
  constructor(
    public readonly scope: ScopeType,
    public readonly name: IToken,
    public state: LockState,
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

  get tag(): 'lock' {
    return 'lock';
  }
}
