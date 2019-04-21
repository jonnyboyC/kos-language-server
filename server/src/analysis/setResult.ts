import { ISetResolverResult, ILocalResult } from './types';
import { IToken } from '../entities/types';

export const setResult = (set: Maybe<IToken> = undefined, ...used: ILocalResult[][]):
  ISetResolverResult => {
  return {
    set,
    used: used.reduce((acc, curr) => acc.concat(curr), []),
  };
};
