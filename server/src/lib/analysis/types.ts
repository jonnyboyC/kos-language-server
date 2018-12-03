import { KsVariable } from "./variable";
import { KsFunction } from "./function";
import { KsLock } from "./lock";
import { KsParameter } from "./parameters";
import { IToken } from "../scanner/types";

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

export interface IScope extends Map<string, KsEntity> {
}

export interface IResolverError {
    readonly token: IToken; 
    readonly message: string;    
    readonly otherInfo: string[];
}

export type KsEntity = KsVariable | KsFunction | KsLock | KsParameter;

export interface IStack<T> extends Pick<Array<T>, 'pop' | 'push' | 'length'> {
    [index: number]: T
}