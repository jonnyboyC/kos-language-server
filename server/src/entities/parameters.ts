import { IToken } from './types';
import { KsSymbolKind, SymbolState } from '../analysis/types';

export class KsParameter {
  constructor(
    public readonly name: IToken,
    public readonly defaulted: boolean,
    public readonly state: SymbolState,
  )
  { }

  get tag(): KsSymbolKind.parameter {
    return KsSymbolKind.parameter;
  }
}
