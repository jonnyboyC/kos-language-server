import { ISetResolverResult } from '../types';
import { flatten } from '../../utilities/arrayUtils';
import { Token } from '../../models/token';

export const setResult = (
  set: Maybe<Token> = undefined,
  ...used: Token[][]
): ISetResolverResult => {
  return {
    set,
    used: flatten(used),
  };
};
