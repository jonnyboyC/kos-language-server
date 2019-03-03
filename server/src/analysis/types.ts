import { KsVariable } from '../entities/variable';
import { KsFunction } from '../entities/function';
import { KsLock } from '../entities/lock';
import { IToken } from '../entities/types';
import { KsParameter } from '../entities/parameters';
import { Range, Location } from 'vscode-languageserver';
import { IArgumentType, IFunctionType } from '../typeChecker/types/types';
import { IExpr, ISuffixTerm } from '../parser/types';

export const enum EntityState {
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

export interface IScope extends Map<string, IKsEntityTracker> {
  entities(): KsEntity[];
}

export interface IKsEntityTracker<T extends KsEntity = KsEntity> {
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

export interface IKsDeclared<T extends KsEntity> extends Location {
  entity: T;
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

export type KsEntity = KsVariable | KsFunction | KsLock | KsParameter;

// tslint:disable-next-line:prefer-array-literal
export interface IStack<T> extends Pick<Array<T>, 'pop' | 'push' | 'length'> {
  [index: number]: T;
  [Symbol.iterator](): IterableIterator<T>;
}
