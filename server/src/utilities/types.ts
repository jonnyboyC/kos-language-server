type Maybe<T> = T | undefined;
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type PartialRequire<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;
