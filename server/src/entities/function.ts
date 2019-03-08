import { ScopeType } from '../parser/types';
import { IToken } from './types';
import { KsParameter } from './parameters';
import { KsSymbolKind } from '../analysis/types';

export class KsFunction {
  public readonly requiredParameters: number;

  constructor(
    public readonly scope: ScopeType,
    public readonly name: IToken,
    public readonly parameters: KsParameter[],
    public readonly returnValue: boolean,
  ) {
    this.requiredParameters = parameters
      .filter(parameter => !parameter.defaulted)
      .length;
  }

  get tag(): KsSymbolKind.function {
    return KsSymbolKind.function;
  }
}
