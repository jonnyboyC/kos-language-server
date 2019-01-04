import { IToken } from './types';
import { EntityState } from '../analysis/types';

export class KsParameter {
  constructor(
    public readonly name: IToken,
    public readonly defaulted: boolean,
    public state: EntityState,
  )
  { }

  get tag(): 'parameter' {
    return 'parameter';
  }
}
