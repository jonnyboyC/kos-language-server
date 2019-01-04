import { KsVariable } from '../entities/variable';
import { KsFunction } from '../entities/function';
import { KsLock } from '../entities/lock';
import { IToken } from '../entities/types';
import { KsParameter } from '../entities/parameters';
import { Range } from 'vscode-languageserver';

export const enum EntityState {
  declared,
  used,
}

export const enum LockState {
  locked,
  used,
  unlocked,
}

export interface IScope extends Map<string, KsEntity> {
}

export interface IRealScopePosition extends Range {
  tag: 'real';
}

export interface IGlobalScopePosition {
  tag: 'global';
}

type IScopePosition = IRealScopePosition | IGlobalScopePosition;

export interface IScopeNode {
  position: IScopePosition;
  scope: IScope;
  children: IScopeNode[];
}

export interface IResolverError extends Range {
  readonly token: IToken;
  readonly message: string;
  readonly otherInfo: string[];
}

export type KsEntity = KsVariable | KsFunction | KsLock | KsParameter;

// tslint:disable-next-line:prefer-array-literal
export interface IStack<T> extends Pick<Array<T>, 'pop' | 'push' | 'length'> {
  [index: number]: T;
  [Symbol.iterator](): IterableIterator<T>;
}
