export const empty = <T>(value: Maybe<T>): value is undefined => {
  return value === undefined;
}