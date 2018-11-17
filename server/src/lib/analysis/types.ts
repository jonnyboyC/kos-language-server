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
    defined,
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

export enum ScopeType {
    local,
    global,
}

export interface IScope {
    [thing: string]: KsVariable
}

export type Entity = KsVariable | KsFunction | KsLock | KsParameter;

export interface IStack<T> extends Pick<Array<T>, 'pop' | 'push'> {}