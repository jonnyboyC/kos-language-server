/**
 * Maybe type for things that might be undefined
 */
type Maybe<T> = T | undefined;

/**
 * Helper type the dual of pick
 */
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Require certain fields to not be undefined or null
 */
type PartialRequire<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

/**
 * The type helper restricts the type to constructor functions
 * or classes
 */
type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * This type helper picks all the property names that are functions
 */
type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];

/**
 * This type helper picks all properties off an interface that are functions
 */
type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;

/**
 * This type helper picks all property name that are not functions
 */
type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];

/**
 * This type helper picks all properties off an interface that are not functions
 */
type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
/**
 * Currenlty used in signiture utilities
 */
interface IdentifierIndex {
  identifier: string;
  index: number;
}

/**
 * Base logger interface, mirror vscodes logger
 */
interface ILoggerBase {
  error(message: string): void;
  warn(message: string): void;
  info(message: string): void;
  log(message: string): void;
}

/**
 * Interface for internal logger
 */
interface ILogger extends ILoggerBase {
  level: LogLevel;

  verbose(message: string): void;
}

/**
 * Logging level internal to kos-language-server
 */
const enum LogLevel {
  verbose,
  info,
  log,
  warn,
  error,
  none,
}

/**
 * Interface for internal tracer
 */
interface ITracer {
  log(message: string, verbose?: string): void;
}

/**
 * This is used by the various completion functionailities
 * to decide how they should be cased
 */
const enum CaseKind {
  lowercase,
  uppercase,
  camelcase,
  pascalcase,
}