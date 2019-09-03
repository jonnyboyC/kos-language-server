import { KsVariable } from '../entities/variable';
import { KsFunction } from '../entities/function';
import { KsLock } from '../entities/lock';
import { KsParameter } from '../entities/parameter';
import { Range, Location, Diagnostic } from 'vscode-languageserver';
import { IExpr, IStmt, ScopeKind } from '../parser/types';
import { BasicTracker } from './tracker';
import { Token } from '../entities/token';
import { KsSuffix } from '../entities/suffix';
import { Environment } from './environment';
import { TypeTracker } from './typeTracker';
import { IType } from '../typeChecker/types';
import { KsGrouping } from '../entities/grouping';

/**
 * The result of a function scan
 */
export interface IFunctionScanResult {
  /**
   * The number of optionals parameters
   */
  optionalParameters: number;

  /**
   * The number of required parameters
   */
  requiredParameters: number;

  /**
   * Does the function return a value
   */
  return: boolean;
}

/**
 * This is the result of the symbol tables use symbol method
 */
export interface UseResult<T extends KsBaseSymbol = KsBaseSymbol> {
  /**
   * Was any error encounted while trying to use this symbol
   */
  error?: Diagnostic;

  /**
   * What was the tracker found for this lookup
   */
  tracker?: BasicTracker<T>;
}

export const enum TrackerKind {
  basic,
  type,
}

/**
 * A union of basic and suffix trackers that a token may be attached too
 */
export type SymbolTracker = BasicTracker | TypeTracker;

/**
 * Interface for tracking symbols throughout a kerboscript
 */
export interface SymbolTrackerBase<T extends KsSymbol = KsSymbol> {
  /**
   * Information about the original declaration of the symbol
   */
  declared: IKsDeclared<T>;
}

/**
 * The path to an environment
 */
export interface EnvironmentPath {
  /**
   * the activated path
   */
  active: IStack<number>;

  /**
   * The back track path
   */
  backTrack: IStack<number>;
}

/**
 * A setting of a symbol
 */
export interface KsSet extends Location {
  /**
   * What is the type of the set
   */
  type: IType;
}

/**
 * The declared type of a symbol
 */
export interface IKsDeclared<
  TSymbol extends KsSymbol = KsSymbol,
  TType extends IType = IType
> extends Location {
  /**
   * The underlying symbol declared
   */
  symbol: TSymbol;

  /**
   * The type of this declared symbol
   */
  type: TType;
}

/**
 * A real range for an environment
 */
export interface RealEnvironmentRange extends Range {
  /**
   * Discriminated union for range kind
   */
  kind: ScopeKind.local;
}

/**
 * A global range for an environment
 */
export interface GlobalEnvironmentRange {
  /**
   * Discriminated union for range kind
   */
  kind: ScopeKind.global;
}

/**
 * A type defining the range an environment is present in
 */
export type EnvironmentRange = RealEnvironmentRange | GlobalEnvironmentRange;

export const enum SearchState {
  dependents,
  dependencies,
}

export interface EnvironmentNode {
  readonly parent: Maybe<EnvironmentNode>;
  readonly range: EnvironmentRange;
  readonly environment: Environment;
  readonly children: EnvironmentNode[];
}

export interface ISetResolverResult {
  readonly set: Maybe<Token>;
  readonly used: Token[];
}

export type KsSymbol = KsBaseSymbol | KsSuffix | KsGrouping;
export type KsBaseSymbol = KsVariable | KsFunction | KsLock | KsParameter;

export enum KsSymbolKind {
  variable,
  function,
  lock,
  parameter,
  suffix,
  grouping,
}

/**
 * This representing a syntax nod that will be executed later
 */
export interface IDeferred {
  /**
   * Path to scope
   */
  path: EnvironmentPath;

  /**
   * Path to scope
   */
  activeScope: EnvironmentNode;

  /**
   * How many loops deep is the current location
   */
  loopDepth: number;

  /**
   * How many functions deep is the current location
   */
  functionDepth: number;

  /**
   * How many triggers deep is the current location
   */
  triggerDepth: number;

  /**
   * Node to be executed later
   */
  node: IStmt | IExpr;
}

/**
 * A more restrictive interface on an array to only allow stack methods
 */
export interface IStack<T> extends Pick<T[], 'pop' | 'push' | 'length'> {
  /**
   * array indexer
   */
  [index: number]: T;

  /**
   * array iterator symbol
   */
  [Symbol.iterator](): IterableIterator<T>;
}
