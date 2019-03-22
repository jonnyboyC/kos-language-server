import { IToken } from './types';
import { SymbolState, KsSymbolKind } from '../analysis/types';

export class KsParameter {
  constructor(
    public readonly name: IToken,
    public readonly defaulted: boolean,
    public state: SymbolState,
  )
  { }

  get tag(): KsSymbolKind.parameter {
    return KsSymbolKind.parameter;
  }
}
