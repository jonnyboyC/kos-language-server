import { IParseError, INodeResult } from './types';

export const nodeResult = <T>(inst: T, errors: IParseError[]):
  INodeResult<T> => {
  return {
    errors,
    value: inst,
  };
};
