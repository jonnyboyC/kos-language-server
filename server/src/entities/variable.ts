import { ScopeType } from '../parser/types';
import { IToken } from './types';
import { EntityType } from '../analysis/types';

export class KsVariable {
  constructor(
    public readonly scope: ScopeType,
    public readonly name: IToken,
  )
  { }

  get tag(): EntityType.variable  {
    return EntityType.variable;
  }
}
