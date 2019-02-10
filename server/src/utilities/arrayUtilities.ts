
export const flatten = <T>(arrays: T[][]): T[] => {
  if (arrays.length === 0) {
    return [];
  }

  return arrays.reduce((acc, curr) => acc.concat(curr), [] as T[]);
};

export function* zip<T1, T2>(arr1: T1[], arr2: T2[]): IterableIterator<[T1, T2]> {
  const minLength = Math.min(arr1.length, arr2.length);

  for (let i = 0; i < minLength; i += 1) {
    yield [arr1[i], arr2[i]];
  }
}
