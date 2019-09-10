/**
 * Is this value undefined
 * @param value maybe T
 */
export const empty = <T>(value: Maybe<T>): value is undefined => {
  return value === undefined;
};

/**
 * Is this value not undefined
 * @param value maybe T
 */
export const notEmpty = <T>(value: Maybe<T>): value is T => {
  return value !== undefined;
};

/**
 * Unwrap the a maybe throws an exception if undefined
 * @param value maybe T
 */
export const unWrap = <T>(value: Maybe<T>): T => {
  if (!empty(value)) {
    return value;
  }

  throw new Error('value was undefined');
};

/**
 * Unwrap an array of maybe values
 * @param values array of maybe T
 */
export const unWrapMany = <T>(...values: Maybe<T>[]): T[] => {
  return values.map(x => unWrap(x));
};
