import { IToken } from './types';
import { EntityState, EntityType } from '../analysis/types';

export class KsParameter {
  constructor(
    public readonly name: IToken,
    public readonly defaulted: boolean,
    public state: EntityState,
  )
  { }

  get tag(): EntityType.parameter {
    return EntityType.parameter;
  }
}
