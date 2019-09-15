import {
  IType,
  Access,
  TypeKind,
  ICallSignature,
  OperatorKind,
  IParametricType,
  IIndexer,
} from '../../types';
import { Operator } from './operator';
import { TypeTracker } from '../../../analysis/models/typeTracker';

export class VariadicType implements IType {
  public readonly anyType: boolean;
  public readonly name: string;
  public readonly access: Access;
  public readonly kind: TypeKind;
  public readonly base: IType;

  constructor(base: IType) {
    this.base = base;
    this.name = base.name;
    this.access = { get: false, set: false };
    this.kind = TypeKind.variadic;
    this.anyType = false;
  }

  public isSubtypeOf(type: IType): boolean {
    return this === type;
  }
  public canCoerceFrom(type: IType): boolean {
    return this === type;
  }
  public assignmentType(): IType {
    return this;
  }
  public callSignature(): Maybe<ICallSignature> {
    return undefined;
  }
  public indexer(): Maybe<IIndexer> {
    throw undefined;
  }
  public getTypeParameters(): IParametricType[] {
    return [];
  }
  public super(): Maybe<IType> {
    return undefined;
  }
  public subTypes(): IType[] {
    return [];
  }
  public tracker(): TypeTracker {
    throw new Error('Method not implemented.');
  }
  public coercions(): Set<IType> {
    return new Set();
  }
  public suffixes(): Map<string, IType> {
    return new Map();
  }
  public getOperator(
    _: OperatorKind,
    __?: Maybe<IType>,
  ): Maybe<Operator<IType>> {
    return undefined;
  }
  public operators(): Map<OperatorKind, Operator<IType>[]> {
    return new Map();
  }
  public toString(): string {
    return `...${this.base.toString()}`;
  }
  public apply(_: IType | Map<IType, IType>): IType {
    return this;
  }
}
