import { ScopeKind } from '../parser/types';
import { IToken } from './types';
import { KsSymbolKind } from '../analysis/types';

export class KsVariable {
  constructor(
    public readonly scope: ScopeKind,
    public readonly name: IToken,
  )
  { }

  get tag(): KsSymbolKind.variable  {
    return KsSymbolKind.variable;
  }
}
