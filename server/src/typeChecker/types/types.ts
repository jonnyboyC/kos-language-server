
interface ITypeMeta<T> {
  toTypeString(): string;
  toConcreteType(type: IArgumentType): T;
}

export const enum TypeKind {
  basic,
  variadic,
  suffix,
  function,
}

export const enum CallType {
  get,
  set,
  call,
  optionalCall,
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
  fullType: boolean;
}

// Could possible delete but does provide a constraint
export interface ITemplateSuffixType<TBasicType, TVariadicType, TConcreteType>
  extends ITypeMeta<TConcreteType> {
  name: string;
  callType: CallType;
  params: TBasicType[] | TVariadicType;
  returns: TBasicType;
  fullType: boolean;
}

export interface IGenericBasicType
  extends ITemplateBasicType<IGenericSuffixType, IArgumentType> {
  tag: TypeKind.basic;
}

export interface IGenericSuffixType
  extends ITemplateSuffixType<IGenericArgumentType, IGenericVariadicType, ISuffixType> {
  tag: TypeKind.suffix;
}

export interface IGenericVariadicType extends ITypeMeta<IVariadicType> {
  type: IGenericBasicType;
  tag: TypeKind.variadic;
}

export type IGenericArgumentType = IGenericBasicType;

export interface IBasicType extends IGenericBasicType {
  inherentsFrom?: IArgumentType;
  suffixes: Map<string, ISuffixType>;
  fullType: true;
  tag: TypeKind.basic;
}

export interface ISuffixType extends IGenericSuffixType {
  params: IArgumentType[] | IVariadicType;
  returns: IArgumentType;
  fullType: true;
  tag: TypeKind.suffix;
}

export interface IVariadicType extends IGenericVariadicType {
  type: IBasicType;
  fullType: true;
  tag: TypeKind.variadic;
}

export type IArgumentType = IBasicType;

export interface IConstantType<T> extends IBasicType {
  value: T;
}

export interface IFunctionType extends ITypeMeta<IFunctionType> {
  name: string;
  callType: CallType.call | CallType.optionalCall;
  params: IArgumentType[] | IVariadicType;
  returns: IArgumentType;
  fullType: true;
  tag: TypeKind.function;
}

export type IType = IArgumentType | IFunctionType | ISuffixType;
