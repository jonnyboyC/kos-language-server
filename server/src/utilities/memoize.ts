import { empty } from './typeGuards';

export const memoize = <T1, TReturn>(func: (arg1: T1) => TReturn): (arg1: T1) => TReturn => {
  const memory: Map<T1, TReturn> = new Map();

  return (arg1: T1): TReturn => {
    const result = memory.get(arg1);
    if (!empty(result)) return result;

    const newResult = func(arg1);
    memory.set(arg1, newResult);
    return newResult;
  };
};
