export const empty = <T>(value: Maybe<T>): value is undefined => {
  return value === undefined;
};

export const notEmpty = <T>(value: Maybe<T>): value is T => {
  return value !== undefined;
};
