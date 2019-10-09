import { IParseError, INodeResult } from '../types';

export const nodeResult = <T>(
  stmt: T,
  errors: IParseError[],
): INodeResult<T> => {
  return {
    errors,
    value: stmt,
  };
};
