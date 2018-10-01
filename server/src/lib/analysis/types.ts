import { KsVariable } from "./variable";

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

export enum ScopeType {
    local,
    global,
}

export interface IScope {
    [thing: string]: KsVariable
}

export interface IStack<T> extends Pick<Array<T>, 'pop' | 'push'> {}