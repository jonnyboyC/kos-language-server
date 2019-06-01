import { KsVariable } from '../entities/variable';
import { KsFunction } from '../entities/function';
import { KsLock } from '../entities/lock';
import { KsParameter } from '../entities/parameter';
import { Range, Location } from 'vscode-languageserver';
import { ArgumentType, Type } from '../typeChecker/types/types';
import { IExpr, IStmt, ScopeKind } from '../parser/types';
import { BasicTracker } from './tracker';
import { Token } from '../entities/token';
import { KsSuffix } from '../entities/suffix';
import { Environment } from './environment';
import { SuffixTracker } from './suffixTracker';

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

export const enum TrackerKind {
  basic,
  suffix,
}

/**
 * A union of basic and suffix trackers that a token may be attached too
 */
export type SymbolTracker = BasicTracker | SuffixTracker;

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
  type: ArgumentType;
}

/**
 * The declared type of a symbol
 */
export interface IKsDeclared<
  TSymbol extends KsSymbol = KsSymbol,
  TType extends Type = Type
> extends Location {
  symbol: TSymbol;
  type: TType;
}

export interface IRealScopePosition extends Range {
  kind: ScopeKind.local;
}

export interface IGlobalScopePosition {
  kind: ScopeKind.global;
}

export type EnvironmentPosition = IRealScopePosition | IGlobalScopePosition;

export interface GraphNode<T> {
  value: T;
  adjacentNodes: GraphNode<T>[];
}

export interface EnvironmentNode {
  readonly parent: Maybe<EnvironmentNode>;
  readonly position: EnvironmentPosition;
  readonly environment: Environment;
  readonly children: EnvironmentNode[];
}

export interface ISetResolverResult {
  readonly set: Maybe<Token>;
  readonly used: Token[];
}

export type KsSymbol = KsBaseSymbol | KsSuffix;
export type KsBaseSymbol = KsVariable | KsFunction | KsLock | KsParameter;

export enum KsSymbolKind {
  variable,
  function,
  lock,
  parameter,
  suffix,
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
