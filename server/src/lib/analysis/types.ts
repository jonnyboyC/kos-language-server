import { KsVariable } from "./variable";
import { KsFunction } from "./function";
import { KsLock } from "./lock";
import { KsParameter } from "./parameters";

export enum FunctionType {
    none,
    function,
    initializer,
}

export enum VariableState {
    declared,
    used,
}

export enum ParameterState {
    defined,
    used
}

export enum LockState {
    locked,
    unlocked,
}

export interface IScope extends Map<string, KsVariable> {
}

export type Entity = KsVariable | KsFunction | KsLock | KsParameter;

export interface IStack<T> extends Pick<Array<T>, 'pop' | 'push' | 'length'> {
    [index: number]: T
}