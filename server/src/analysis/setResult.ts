import { ISetResolverResult } from './types';
import { IToken } from '../entities/types';
import { flatten } from '../utilities/arrayUtils';

export const setResult = (
  set: Maybe<IToken> = undefined,
  ...used: IToken[][]
): ISetResolverResult => {
  return {
    set,
    used: flatten(used),
  };
};
