import { empty } from "./typeGuards";

export const memoize1 = <T1, TReturn>(func: (arg1: T1) => TReturn): (arg1: T1) => TReturn => {
  const memory: Map<T1, TReturn> = new Map();

  return (arg1: T1): TReturn => {
    const result = memory.get(arg1);
    if (!empty(result)) return result;

    const newResult = func(arg1);
    memory.set(arg1, newResult);
    return newResult;
  }
}


export const memoize2 = <T1, T2, TReturn>(func: (arg1: T1, arg2: T2) => TReturn): (arg1: T1, arg2: T2) => TReturn => {
  const memory: Map<[T1, T2], TReturn> = new Map();

  return (arg1: T1, arg2: T2): TReturn => {
    const args: [T1, T2] = [arg1, arg2];
    const result = memory.get(args);
    if (!empty(result)) return result;

    const newResult = func(arg1, arg2);
    memory.set(args, newResult);
    return newResult;
  }
}

export const memoize3 = <T1, T2, T3, TReturn>(func: (arg1: T1, arg2: T2, arg3: T3) => TReturn):
  (arg1: T1, arg2: T2, arg3: T3) => TReturn => {
  const memory: Map<[T1, T2, T3], TReturn> = new Map();

  return (arg1: T1, arg2: T2, arg3: T3): TReturn => {
    const args: [T1, T2, T3] = [arg1, arg2, arg3];
    const result = memory.get(args);
    if (!empty(result)) return result;

    const newResult = func(arg1, arg2, arg3);
    memory.set(args, newResult);
    return newResult;
  }
}