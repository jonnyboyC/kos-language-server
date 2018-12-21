import { VariableState } from '../analysis/types';
import { ScopeType } from '../parser/types';
import { IToken } from './types';

export class KsVariable {
  constructor(
    public readonly scope: ScopeType,
    public readonly name: IToken,
    public state: VariableState,
  )
  { }

  get tag(): 'variable' {
    return 'variable';
  }
}
