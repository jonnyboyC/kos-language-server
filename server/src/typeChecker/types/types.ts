export interface IGenericTypeCore {
  readonly name: string;
  readonly call: boolean;
  readonly set: boolean;
  params?: IGenericType[] | IGenericVarType;
  returns?: IGenericType;
}

export interface IGenericType {
  readonly name: string;
  readonly core: IGenericTypeCore;
  inherentsFrom?: IGenericType;
  suffixes: IGenericSuffixMap;
  toConcreteType(type: IType): IType;
  toTypeString(): string;
}

export interface ITypeCore extends IGenericTypeCore {
  params?: IType[] | IVarType;
  returns?: IType;
  tag: 'core';
}

export interface ITypeGenericBetter {
  readonly name: string;
  suffixes: ISuffixMap;
  inherentsFrom?: IType;
  toConcreteType(type: ITypeBetter): ITypeBetter;
  toTypeString(): string;
}

export interface ITypeBetter extends ITypeGenericBetter {
  tag: 'type';
}

export interface IType extends IGenericType {
  readonly core: ITypeCore;
  inherentsFrom?: IType;
  suffixes: ISuffixMap;
  tag: 'type';
}

export interface IConstantType<T> extends IType {
  value: T;
}

export type ISuffixMap = Map<string, IType>;
export type IGenericSuffixMap = Map<string, IGenericType>;

export interface IGenericVarType {
  type: IGenericType;
}

export interface IVarType {
  type: IType;
  tag: 'varType';
}
