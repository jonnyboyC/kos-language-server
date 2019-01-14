import { KsVariable } from '../entities/variable';
import { KsFunction } from '../entities/function';
import { KsLock } from '../entities/lock';
import { IToken } from '../entities/types';
import { KsParameter } from '../entities/parameters';
import { Range } from 'vscode-languageserver';
import { IType } from '../typeChecker/types/types';

export const enum EntityState {
  declared,
  used,
}

export const enum LockState {
  locked,
  used,
  unlocked,
}

export interface IScope extends Map<string, IKsEntityTracker> {
  entities(): KsEntity[];
}

export interface IKsEntityTracker<T extends KsEntity = KsEntity> {
  declared: IKsDeclared<T>;
  usages: IKsUsage[];
}

export interface IKsDeclared<T extends KsEntity> {
  entity: T;
  type: IType;
}

export interface IKsUsage {
  range: Range;
  type: IType;
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
  readonly used: IToken[];
}

export type KsEntity = KsVariable | KsFunction | KsLock | KsParameter;

// tslint:disable-next-line:prefer-array-literal
export interface IStack<T> extends Pick<Array<T>, 'pop' | 'push' | 'length'> {
  [index: number]: T;
  [Symbol.iterator](): IterableIterator<T>;
}
