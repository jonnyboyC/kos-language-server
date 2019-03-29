export const empty = <T>(value: Maybe<T>): value is undefined => {
  return value === undefined;
};

export const notEmpty = <T>(value: Maybe<T>): value is T => {
  return value !== undefined;
};

export const unWrap = <T>(value: Maybe<T>): T => {
  if (!empty(value)) {
    return value;
  }

  throw new Error('value was undefined');
};

export const unWrapMany = <T>(...values: Maybe<T>[]): T[] => {
  return values.map(x => unWrap(x));
};
