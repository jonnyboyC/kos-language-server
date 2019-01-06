
export const flatten = <T>(arrays: T[][]): T[] => {
  if (arrays.length === 0) {
    return [];
  }

  return arrays.reduce((acc, curr) => acc.concat(curr), [] as T[]);
};
