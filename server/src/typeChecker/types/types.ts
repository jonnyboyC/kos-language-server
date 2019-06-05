import { SuffixTracker } from '../../analysis/suffixTracker';

interface ITypeMeta<T> {
  toTypeString(): string;
  toConcreteType(type: ArgumentType): T;
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
  superType?: ITemplateBasicType<TSuffixType, TConcreteType>;
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
  extends ITemplateBasicType<IGenericSuffixType, ArgumentType> {
  kind: TypeKind.basic;
}

export interface IGenericSuffixType
  extends ITemplateSuffixType<IGenericArgumentType, IGenericVariadicType, ISuffixType> {
  kind: TypeKind.suffix;
}

export interface IGenericVariadicType extends ITypeMeta<IVariadicType> {
  type: IGenericBasicType;
  kind: TypeKind.variadic;
}

export type IGenericArgumentType = IGenericBasicType;

export interface IBasicType extends IGenericBasicType {
  superType?: ArgumentType;
  suffixes: Map<string, ISuffixType>;
  fullType: true;
  kind: TypeKind.basic;
}

export interface ISuffixType extends IGenericSuffixType {
  params: ArgumentType[] | IVariadicType;
  returns: ArgumentType;
  fullType: true;
  kind: TypeKind.suffix;
  getTracker(): SuffixTracker;
}

export interface IVariadicType extends IGenericVariadicType {
  type: IBasicType;
  fullType: true;
  kind: TypeKind.variadic;
}

export type ArgumentType = IBasicType;

export interface IConstantType<T> extends IBasicType {
  value: T;
}

export interface IFunctionType extends ITypeMeta<IFunctionType> {
  name: string;
  callType: CallType.call | CallType.optionalCall;
  params: ArgumentType[] | IVariadicType;
  returns: ArgumentType;
  fullType: true;
  kind: TypeKind.function;
}

export type Type = ArgumentType | IFunctionType | ISuffixType;
