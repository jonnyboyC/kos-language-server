import { SuffixTracker } from '../../analysis/suffixTracker';
import { CallKind, TypeKind, OperatorKind } from '../types';
import { Operator } from '../operator';

interface ITypeMeta<T> {
  toTypeString(): string;
  toConcreteType(type: ArgumentType): T;
}

// Could possible delete but does provide a constraint
export interface ITemplateBasicType<TSuffixType, TConcreteType>
  extends ITypeMeta<TConcreteType> {
  name: string;
  suffixes: Map<string, TSuffixType>;
  operators: Map<OperatorKind, Operator[]>;
  superType?: ITemplateBasicType<TSuffixType, TConcreteType>;
  fullType: boolean;
}

// Could possible delete but does provide a constraint
export interface ITemplateSuffixType<TBasicType, TVariadicType, TConcreteType>
  extends ITypeMeta<TConcreteType> {
  name: string;
  callType: CallKind;
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
  callType: CallKind.call | CallKind.optionalCall;
  params: ArgumentType[] | IVariadicType;
  returns: ArgumentType;
  fullType: true;
  kind: TypeKind.function;
}

export type Type = ArgumentType | IFunctionType | ISuffixType;
