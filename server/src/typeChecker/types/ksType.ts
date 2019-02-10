import { empty } from '../../utilities/typeGuards';
import { createVarType, isFullType, isFullVarType } from './typeUitlities';
import {
  IGenericArgumentType,
  IArgumentType,
  IGenericSuffixType,
  IGenericVariadicType,
  SuffixCallType,
  IGenericBasicType,
  IConstantType,
  IBasicType,
  ISuffixType,
  IVariadicType,
  IFunctionType,
  Operator,
} from './types';
import { memoize } from '../../utilities/memoize';

export class GenericType implements IGenericBasicType {
  private concreteTypes: Map<IArgumentType, IBasicType>;
  public operators: Map<Operator, IBasicType>;
  public suffixes: Map<string, IGenericSuffixType>;
  public inherentsFrom?: IGenericArgumentType;

  constructor(public readonly name: string) {
    this.suffixes = new Map();
    this.concreteTypes = new Map();
    this.operators = new Map();
  }

  public toTypeString(): string {
    return this.name;
  }

  public toConcreteType(type: IArgumentType): IArgumentType {
    // check cache
    const cache = this.concreteTypes.get(type);
    if (!empty(cache)) {
      return cache;
    }

    const newType = new Type(this.name);

    const newInherentsFrom = !empty(this.inherentsFrom)
      ? this.inherentsFrom.toConcreteType(type)
      : undefined;

    // add suffixes and prototype
    for (const [name, suffixType] of this.suffixes.entries()) {
      newType.suffixes.set(name, suffixType.toConcreteType(type));
    }
    newType.operators = new Map(this.operators);
    newType.inherentsFrom = newInherentsFrom;

    this.concreteTypes.set(type, newType);
    return newType;
  }

  public get tag(): 'type' {
    return 'type';
  }
}

export class GenericSuffixType implements IGenericSuffixType {
  private concreteTypes: Map<IArgumentType, ISuffixType>;

  constructor(
    public readonly name: string,
    public readonly callType: SuffixCallType,
    public readonly params: IGenericArgumentType[] | IGenericVariadicType,
    public readonly returns: IGenericArgumentType,
  ) {
    this.concreteTypes = new Map();
  }

  public toTypeString(): string {
    if (this.callType !== SuffixCallType.call) {
      return `${this.name}<T>`;
    }

    const returnString = returnTypeString(this.returns);
    const paramsString = parameterTypeString(this.params);

    return `<T>(${paramsString}) => ${returnString}`;
  }

  private newParameters(params: IGenericArgumentType[] | IGenericVariadicType, type: IArgumentType):
    IArgumentType[] | IVariadicType {

    // check if variadic type
    if (!Array.isArray(params)) {
      return isFullVarType(params)
        ? params
        : createVarType(type);
    }

    const newParams: IArgumentType[] = [];
    for (const param of params) {
      newParams.push(isFullType(param) ? param : type);
    }

    return newParams;
  }

  private newReturn(
    returns: IGenericArgumentType,
    type: IArgumentType): IArgumentType {
    return !empty(returns) && isFullType(returns)
      ? returns
      : type;
  }

  public toConcreteType(type: IArgumentType): ISuffixType {
    // check cache
    const cache = this.concreteTypes.get(type);
    if (!empty(cache)) {
      return cache;
    }

    // generate concete parameters
    const newParams = this.newParameters(this.params, type);

    // generate concrete return
    const newReturns = this.newReturn(this.returns, type);
    const newType = new SuffixType(this.name, this.callType, newParams, newReturns);

    this.concreteTypes.set(type, newType);
    return newType;
  }

  public get tag(): 'suffix' {
    return 'suffix';
  }
}

export class Type implements IBasicType {
  public suffixes: Map<string, ISuffixType>;
  public inherentsFrom?: IArgumentType;
  public operators: Map<Operator, IBasicType>;
  constructor(public readonly name: string) {
    this.suffixes = new Map();
    this.operators = new Map();
  }

  // tslint:disable-next-line:variable-name
  public toConcreteType(_type: IArgumentType): IArgumentType {
    return this;
  }

  public toTypeString(): string {
    return this.name;
  }

  get fullType(): true {
    return true;
  }

  get tag(): 'type' {
    return 'type';
  }
}

export class SuffixType implements ISuffixType {
  constructor(
    public readonly name: string,
    public readonly callType: SuffixCallType,
    public readonly params: IArgumentType[] | IVariadicType,
    public readonly returns: IArgumentType) {
  }

  public toTypeString(): string {
    if (this.callType !== SuffixCallType.call) {
      return `${this.name}`;
    }

    const returnString = returnTypeString(this.returns);
    const paramsString = parameterTypeString(this.params);

    return `(${paramsString}) => ${returnString}`;
  }

  // tslint:disable-next-line:variable-name
  public toConcreteType(_type: IArgumentType): ISuffixType {
    return this;
  }

  public get fullType(): true {
    return true;
  }

  public get tag(): 'suffix' {
    return 'suffix';
  }
}

export class ConstantType<T> extends Type implements IConstantType<T> {
  constructor(name: string, public readonly value: T) {
    super(name);
  }

  public toTypeString(): string {
    return `${super.toTypeString()} = ${this.value}`;
  }
}

export class GenericVariadicType implements IGenericVariadicType {
  private concreteTypes: Map<IArgumentType, IVariadicType>;

  constructor(public readonly type: IGenericBasicType) {
    this.concreteTypes = new Map();
  }
  public toTypeString(): string {
    return `...${this.type.name}[]`;
  }
  public toConcreteType(type: IBasicType): IVariadicType {
    // check cache
    const cache = this.concreteTypes.get(type);
    if (!empty(cache)) {
      return cache;
    }

    const newType = new VariadicType(type);
    this.concreteTypes.set(type, newType);
    return newType;
  }
  public get tag(): 'variadic' {
    return 'variadic';
  }
}

export class VariadicType extends GenericVariadicType implements IVariadicType {
  constructor(public readonly type: IBasicType) {
    super(type);
  }
  // tslint:disable-next-line:variable-name
  public toConcreteType(_type: IBasicType): IVariadicType {
    return this;
  }
  public get fullType(): true {
    return true;
  }
  public get tag(): 'variadic' {
    return 'variadic';
  }
}

export class FunctionType implements IFunctionType {
  constructor(
    public readonly name: string,
    public readonly params: IArgumentType[] | IVariadicType,
    public readonly returns: IArgumentType)
  { }

  public toTypeString(): string {
    const returnString = returnTypeString(this.returns);
    const paramsString = parameterTypeString(this.params);

    return `(${paramsString}) => ${returnString}`;
  }

  public toConcreteType(_: IBasicType): IFunctionType {
    return this;
  }

  public get tag(): 'function' {
    return 'function';
  }

  public get fullType(): true {
    return true;
  }
}

const returnTypeString = (returns?: IGenericArgumentType) => {
  return empty(returns)
    ? 'void'
    : returns.toTypeString();
};

const parameterTypeString = (params: IGenericArgumentType[] | IGenericVariadicType) => {
  // empty string for no params
  if (empty(params)) {
    return '';
  }

  // check if variadic type
  if (!Array.isArray(params)) {
    return params.toTypeString();
  }

  // string separated i
  return params
    .map(param => param.toTypeString())
    .join(', ');
};

export const createGenericStructureType = (name: string):
  IGenericArgumentType => {
  return new GenericType(name);
};

export const getTypeParameter = memoize((name: string): IGenericBasicType => {
  return createGenericStructureType(name);
});

export const tType = getTypeParameter('T');

export const createStructureType = (name: string): IBasicType => {
  return new Type(name);
};

export const createGenericArgSuffixType = (
  name: string,
  returns: IGenericArgumentType,
  ...params: IGenericArgumentType[]): IGenericSuffixType => {
  return new GenericSuffixType(name, SuffixCallType.call, params, returns);
};

export const createArgSuffixType = (
  name: string,
  returns: IArgumentType,
  ...params: IArgumentType[]): ISuffixType => {
  return new SuffixType(name, SuffixCallType.call, params, returns);
};

export const createSuffixType = (name: string, returns: IArgumentType): ISuffixType => {
  return new SuffixType(name, SuffixCallType.get, [], returns);
};

export const createSetSuffixType = (name: string, returns: IArgumentType): ISuffixType => {
  return new SuffixType(name, SuffixCallType.set, [], returns);
};

export const createVarSuffixType = (
  name: string,
  returns: IArgumentType,
  params: IVariadicType): ISuffixType => {
  return new SuffixType(name, SuffixCallType.call, params, returns);
};

export const createFunctionType = (
  name: string,
  returns: IArgumentType,
  ...params: IArgumentType[]): IFunctionType => {
  return new FunctionType(name, params, returns);
};

export const createVarFunctionType = (
  name: string,
  returns: IArgumentType,
  params: IVariadicType): IFunctionType => {
  return new FunctionType(name, params, returns);
};
