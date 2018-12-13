import { KsVariable } from "./variable";
import { KsFunction } from "./function";
import { KsLock } from "./lock";
import { KsParameter } from "./parameters";
import { IToken } from "../scanner/types";

export const enum FunctionState {
    declared,
    used,
}

export const enum VariableState {
    declared,
    used,
}

export const enum ParameterState {
    declared,
    used
}

export const enum LockState {
    locked,
    used,
    unlocked,
}

export interface IScope extends Map<string, KsEntity> {
}

export interface IScopeNode {
    scope: IScope;
    children: IScopeNode[];
}

export interface IResolverError {
    readonly token: IToken; 
    readonly message: string;    
    readonly otherInfo: string[];
}

export type KsEntity = KsVariable | KsFunction | KsLock | KsParameter;

export interface IStack<T> extends Pick<Array<T>, 'pop' | 'push' | 'length'> {
    [index: number]: T
    [Symbol.iterator](): IterableIterator<T>
}