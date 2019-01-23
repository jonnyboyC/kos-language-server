import { ISetResolverResult, ILocalResult } from './types';
import { empty } from '../utilities/typeGuards';
import { IToken } from '../entities/types';

export const setResult = (set: Maybe<IToken> = undefined, ...used: ILocalResult[][]):
  ISetResolverResult => {
  if (empty(used)) {
    return { set, used: [] };
  }

  return {
    set,
    used: used.reduce((acc, curr) => acc.concat(curr), []),
  };
};
