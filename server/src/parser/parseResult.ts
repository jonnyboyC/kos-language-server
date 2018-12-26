import { IParseError, IParseResult } from './types';
import { empty } from '../utilities/typeGuards';

export const parseResult = <T>(inst: T, ...errors: IParseError[][]):
  IParseResult<T> => {
  if (empty(errors)) {
    return { value: inst, errors: [] };
  }

  return {
    value: inst,
    errors: errors.reduce((acc, curr) => acc.concat(curr), [] as IParseError[]),
  };
};
