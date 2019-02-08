type Maybe<T> = T | undefined;
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type PartialRequire<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

interface IdentifierIndex {
  identifier: string;
  index: number;
}

interface ILoggerBase {
  error(message: string): void;
  warn(message: string): void;
  info(message: string): void;
  log(message: string): void;
}

interface ILogger extends ILoggerBase {
  verbose(message: string): void;
}

const enum LogLevel {
  verbose,
  info,
  warn,
  error,
  log,
  none,
}

interface ITracer {
  log(message: string, verbose?: string): void;
}

type Constructor<T = {}> = new (...args: any[]) => T;
