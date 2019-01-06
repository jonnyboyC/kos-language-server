import { IParseError, INodeResult } from './types';
import { empty } from '../utilities/typeGuards';

export const nodeResult = <T>(inst: T, ...errors: IParseError[][]):
  INodeResult<T> => {
  if (empty(errors)) {
    return { value: inst, errors: [] };
  }

  return {
    value: inst,
    errors: errors.reduce((acc, curr) => acc.concat(curr), []),
  };
};
