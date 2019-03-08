import { KsVariable } from '../entities/variable';
import { KsFunction } from '../entities/function';
import { KsLock } from '../entities/lock';
import { IToken } from '../entities/types';
import { KsParameter } from '../entities/parameters';
import { Range, Location } from 'vscode-languageserver';
import { IArgumentType, IFunctionType } from '../typeChecker/types/types';
import { IExpr, ISuffixTerm } from '../parser/types';

export const enum SymbolState {
  declared,
  used,
}

export const enum LockState {
  locked,
  used,
  unlocked,
}

export interface ILocalResult {
  token: IToken;
  expr: IExpr | ISuffixTerm;
}

export interface IScope extends Map<string, IKsSymbolTracker> {
  symbols(): KsSymbol[];
}

export interface IKsSymbolTracker<T extends KsSymbol = KsSymbol> {
  declared: IKsDeclared<T>;
  sets: IKsChange[];
  usages: IKsChange[];

  declareType(type: IArgumentType | IFunctionType): void;
  getType(loc: Location): Maybe<IArgumentType | IFunctionType>;
  setType(loc: Location, type: IArgumentType | IFunctionType): void;
}

export interface IKsChange extends Location {
  type: IArgumentType;
  expr?: IExpr | ISuffixTerm;
}

export interface IKsDeclared<T extends KsSymbol> extends Location {
  symbol: T;
  type: IArgumentType | IFunctionType;
}

export interface IRealScopePosition extends Range {
  tag: 'real';
}

export interface IGlobalScopePosition {
  tag: 'global';
}

type IScopePosition = IRealScopePosition | IGlobalScopePosition;

export interface GraphNode<T> {
  value: T;
  adjacentNodes: GraphNode<T>[];
}

export interface IScopeNode {
  readonly position: IScopePosition;
  readonly scope: IScope;
  readonly children: IScopeNode[];
}

export interface IResolverError extends Range {
  readonly token: IToken;
  readonly message: string;
  readonly otherInfo: string[];
}

export interface ISetResolverResult {
  readonly set: Maybe<IToken>;
  readonly used: ILocalResult[];
}

export type KsSymbol = KsVariable | KsFunction | KsLock | KsParameter;

export enum KsSymbolKind {
  variable,
  function,
  lock,
  parameter,
  suffix,
}

// tslint:disable-next-line:prefer-array-literal
export interface IStack<T> extends Pick<Array<T>, 'pop' | 'push' | 'length'> {
  [index: number]: T;
  [Symbol.iterator](): IterableIterator<T>;
}
