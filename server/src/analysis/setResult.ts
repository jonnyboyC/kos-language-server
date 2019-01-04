import { ISetResolverResult } from './types';
import { empty } from '../utilities/typeGuards';
import { IToken } from '../entities/types';

export const setResult = (set: Maybe<IToken> = undefined, ...used: IToken[][]):
  ISetResolverResult => {
  if (empty(used)) {
    return { set, used: [] };
  }

  return {
    set,
    used: used.reduce((acc, curr) => acc.concat(curr), []),
  };
};
