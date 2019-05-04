import { ScopeType } from '../parser/types';
import { IToken } from './types';
import { KsSymbolKind } from '../analysis/types';

export class KsFunction {
  constructor(
    public readonly scope: ScopeType,
    public readonly name: IToken,
    public readonly requiredParameters: number,
    public readonly optionalParameters: number,
    public readonly returnValue: boolean,
  ) {
  }

  get tag(): KsSymbolKind.function {
    return KsSymbolKind.function;
  }
}
