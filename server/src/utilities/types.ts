/**
 * Maybe type for things that might be undefined
 */
type Maybe<T> = T | undefined;

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
 * This type helper gets the property type of a parent type
 */
type PropType<T, K extends keyof T> = T[K];

/**
 * This type helper gets all property names of type T that extend type U
 */
type PropertyNames<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * This type helper get all properties of type T that extend type U
 */
type Properties<T, U> = Pick<T, PropertyNames<T, U>>;

/**
 * Create a writable version of a readonly mapped type
 */
type Writeable<T> = {
  -readonly [P in keyof T]-?: T[P];
};

/**
 * Currently used in signature utilities
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
  lowerCase,
  upperCase,
  camelCase,
  pascalCase,
}

/**
 * An interface for representing directed graphs
 */
interface GraphNode<T> {
  /**
   * The value at the graph node
   */
  value(): T;

  /**
   * The adjacent nodes to this node
   */
  adjacentNodes(): GraphNode<T>[];
}

interface Dfs<T> {
  reachable: Set<GraphNode<T>>;
  unreachable: Set<GraphNode<T>>;
}
