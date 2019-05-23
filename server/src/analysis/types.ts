import { KsVariable } from '../entities/variable';
import { KsFunction } from '../entities/function';
import { KsLock } from '../entities/lock';
import { IToken } from '../entities/types';
import { KsParameter } from '../entities/parameters';
import { Range, Location } from 'vscode-languageserver';
import { IArgumentType, IFunctionType } from '../typeChecker/types/types';
import { IExpr, IStmt, ScopeKind } from '../parser/types';

export const enum SymbolState {
  declared,
  used,
}

export const enum LockState {
  locked,
  used,
  unlocked,
}

export interface IFunctionScanResult {
  optionalParameters: number;
  requiredParameters: number;
  return: boolean;
}

export interface IScope extends Map<string, IKsSymbolTracker> {
  symbols(): KsSymbol[];
}

/**
 * Interface for tracking symbols throughout a kerboscript
 */
export interface IKsSymbolTracker<T extends KsSymbol = KsSymbol> {
  /**
   * Information about the original declaration of the symbol
   */
  declared: IKsDeclared<T>;

  /**
   * Infromation about locations where the this symbol was set
   */
  sets: IKsSet[];

  /**
   * Locations where this symbol was used
   */
  usages: Location[];

  /**
   * Set the declared type of this symbol
   * @param type type to declare this symbol
   */
  declareType(type: IArgumentType | IFunctionType): void;

  /**
   * Get the type at a location
   * @param loc query location
   */
  getType(loc: Location): Maybe<IArgumentType | IFunctionType>;

  /**
   * Set the type at a location
   * @param loc location to set
   * @param type type to set
   */
  setType(loc: Location, type: IArgumentType | IFunctionType): void;
}

export interface IScopePath {
  active: IStack<number>;
  backTrack: IStack<number>;
}

export interface IKsSet extends Location {
  type: IArgumentType;
}

export interface IKsDeclared<T extends KsSymbol> extends Location {
  symbol: T;
  type: IArgumentType | IFunctionType;
}

export interface IRealScopePosition extends Range {
  kind: ScopeKind.local;
}

export interface IGlobalScopePosition {
  kind: ScopeKind.global;
}

export type IScopePosition = IRealScopePosition | IGlobalScopePosition;

export interface GraphNode<T> {
  value: T;
  adjacentNodes: GraphNode<T>[];
}

export interface IScopeNode {
  readonly parent: Maybe<IScopeNode>;
  readonly position: IScopePosition;
  readonly scope: IScope;
  readonly children: IScopeNode[];
}

export interface ISetResolverResult {
  readonly set: Maybe<IToken>;
  readonly used: IToken[];
}

export type KsSymbol = KsVariable | KsFunction | KsLock | KsParameter;

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
  path: IScopePath;

  /**
   * Path to scope
   */
  activeScope: IScopeNode;

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

// tslint:disable-next-line:prefer-array-literal
export interface IStack<T> extends Pick<Array<T>, 'pop' | 'push' | 'length'> {
  [index: number]: T;
  [Symbol.iterator](): IterableIterator<T>;
}
