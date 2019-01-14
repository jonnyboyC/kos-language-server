import {
  IType,
  ISuffixMap,
  IVarType,
  IConstantType,
  IGenericTypeCore,
  IGenericType,
  IGenericVarType,
  ITypeCore,
  IGenericSuffixMap,
} from './types';
import { empty } from '../utilities/typeGuards';
import { createVarType, isFullType, isFullVarType } from './typeUitlities';

export class TypeCoreGeneric implements IGenericTypeCore {
  constructor(
    public readonly name: string,
    public readonly call: boolean,
    public readonly set: boolean,
    public readonly params?: IGenericType[] | IGenericVarType,
    public readonly returns?: IGenericType) {
  }
}

export class TypeCore extends TypeCoreGeneric implements ITypeCore {
  constructor(
    name: string,
    call: boolean,
    set: boolean,
    public readonly params?: IType[] | IVarType,
    public readonly returns?: IType) {

    super(name, call, set, params, returns);
  }

  get tag(): 'core' {
    return 'core';
  }
}

export class TypeCoreConstant<T> extends TypeCore {
  constructor(
    name: string,
    call: boolean,
    set: boolean,
    public readonly value: T,
    params?: IType[] | IVarType,
    returns?: IType) {

    super(name, call, set, params, returns);
  }
}

export class GenericType implements IGenericType {
  private concreteTypes: Map<IType, IType>;
  public suffixes: IGenericSuffixMap;
  public inherentsFrom?: IType;

  constructor(public readonly core: TypeCoreGeneric) {
    this.suffixes = new Map();
    this.concreteTypes = new Map();
  }

  get name() {
    return this.core.name;
  }

  public toConcreteType(type: IType): IType {
    const cache = this.concreteTypes.get(type);
    if (!empty(cache)) {
      return cache;
    }

    const { name, params, returns, set, call } = this.core;

    let newParams: Maybe<IType[] | IVarType> = undefined;
    if (!empty(params)) {
      if (Array.isArray(params)) {
        newParams = [];
        for (const param of params) {
          newParams.push(isFullType(param) ? param : type);
        }
      } else {
        newParams = isFullVarType(params)
          ? params
          : createVarType(type);
      }
    }

    const newReturns: Maybe<IType> = !empty(returns) && isFullType(returns)
      ? returns
      : type;

    const newType = new Type(new TypeCore(name, call, set, newParams, newReturns));
    const newInherentsFrom = !empty(this.inherentsFrom)
      ? this.inherentsFrom.toConcreteType(type)
      : undefined;

    // add suffixes and prototype
    for (const [name, suffixType] of this.suffixes.entries()) {
      newType.suffixes.set(name, suffixType.toConcreteType(type));
    }
    newType.inherentsFrom = newInherentsFrom;

    this.concreteTypes.set(type, newType);
    return newType;
  }
}

export class Type extends GenericType implements IType {
  public suffixes: ISuffixMap;
  public inherentsFrom?: IType;
  constructor(public readonly core: TypeCore) {
    super(core);

    this.suffixes = new Map();
  }

  public toConcreteType(type: IType): IType {
    const newType = new Type(this.core);

    for (const [name, suffixType] of this.suffixes.entries()) {
      newType.suffixes.set(name, suffixType.toConcreteType(type));
    }
    newType.inherentsFrom = !empty(this.inherentsFrom)
      ? this.inherentsFrom.toConcreteType(type)
      : undefined;

    return newType;
  }

  get tag(): 'type' {
    return 'type';
  }
}

export class ConstantType<T> extends Type implements IConstantType<T> {
  constructor(public readonly core: TypeCoreConstant<T>) {
    super(core);
  }

  get value() {
    return this.core.value;
  }
}

export const createGenericStructureType = (name: string): IGenericType => {
  return new GenericType(new TypeCore(name, false, false));
};

export const tType = createGenericStructureType('T');

export const createStructureType = (name: string): IType => {
  return new Type(new TypeCore(name, false, false));
};

export const createGenericArgSuffixType = (
  name: string,
  returns?: IGenericType,
  ...params: IGenericType[]): IGenericType => {
  return new GenericType(new TypeCoreGeneric(name, false, false, params, returns));
};

export const createArgSuffixType = (name: string, returns?: IType, ...params: IType[]): IType => {
  return new Type(new TypeCore(name, false, false, params, returns));
};

export const createSuffixType = (name: string, returns?: IType): IType => {
  return new Type(new TypeCore(name, true, false, undefined, returns));
};

export const createSetSuffixType = (name: string, returns?: IType): IType => {
  return new Type(new TypeCore(name, true, false, undefined, returns));
};

export const createVarSuffixType = (name: string, returns?: IType, params?: IVarType): IType => {
  return new Type(new TypeCore(name, true, false, params, returns));
};
