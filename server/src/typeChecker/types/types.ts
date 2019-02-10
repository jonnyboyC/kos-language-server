
interface ITypeMeta<T> {
  toTypeString(): string;
  toConcreteType(type: IArgumentType): T;
}

export const enum SuffixCallType {
  get,
  set,
  call,
}

export const enum Operator {
  plus,
  subtract,
  multiply,
  divide,
  power,
  greaterThan,
  lessThan,
  greaterThanEqual,
  lessThanEqual,
  notEqual,
  equal,
}

// Could possible delete but does provide a constraint
export interface ITemplateBasicType<TSuffixType, TConcreteType>
  extends ITypeMeta<TConcreteType> {
  name: string;
  suffixes: Map<string, TSuffixType>;
  operators: Map<Operator, TConcreteType>;
  inherentsFrom?: ITemplateBasicType<TSuffixType, TConcreteType>;
}

// Could possible delete but does provide a constraint
export interface ITemplateSuffixType<TBasicType, TVariadicType, TConcreteType>
  extends ITypeMeta<TConcreteType> {
  name: string;
  callType: SuffixCallType;
  params: TBasicType[] | TVariadicType;
  returns: TBasicType;
}

export interface IGenericBasicType
  extends ITemplateBasicType<IGenericSuffixType, IArgumentType> {
  tag: 'type';
}

export interface IGenericSuffixType
  extends ITemplateSuffixType<IGenericArgumentType, IGenericVariadicType, ISuffixType> {
  tag: 'suffix';
}

export interface IGenericVariadicType extends ITypeMeta<IVariadicType> {
  type: IGenericBasicType;
  tag: 'variadic';
}

export type IGenericArgumentType = IGenericBasicType;

export interface IBasicType extends IGenericBasicType {
  inherentsFrom?: IArgumentType;
  suffixes: Map<string, ISuffixType>;
  fullType: true;
  tag: 'type';
}

export interface ISuffixType extends IGenericSuffixType {
  params: IArgumentType[] | IVariadicType;
  returns: IArgumentType;
  fullType: true;
  tag: 'suffix';
}

export interface IVariadicType extends IGenericVariadicType {
  type: IBasicType;
  fullType: true;
  tag: 'variadic';
}

export type IArgumentType = IBasicType;

export interface IConstantType<T> extends IBasicType {
  value: T;
}

export interface IFunctionType extends ITypeMeta<IFunctionType> {
  name: string;
  params: IArgumentType[] | IVariadicType;
  returns: IArgumentType;
  fullType: true;
  tag: 'function';
}

export type IType = IArgumentType | IFunctionType;
