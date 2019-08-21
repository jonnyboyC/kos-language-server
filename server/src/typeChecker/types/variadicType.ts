import {
  IType,
  Access,
  TypeKind,
  ICallSignature,
  OperatorKind,
  IParametricType,
  IIndexer,
} from '../types';
import { Operator } from './operator';
import { TypeTracker } from '../../analysis/typeTracker';

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
  public getAssignmentType(): IType {
    return this;
  }
  public getCallSignature(): Maybe<ICallSignature> {
    return undefined;
  }
  public getIndexer(): Maybe<IIndexer> {
    throw undefined;
  }
  public getTypeParameters(): IParametricType[] {
    return [];
  }
  public getSuperType(): Maybe<IType> {
    return undefined;
  }
  public getTracker(): TypeTracker {
    throw new Error('Method not implemented.');
  }
  public getCoercions(): Set<IType> {
    return new Set();
  }
  public getSuffixes(): Map<string, IType> {
    return new Map();
  }
  public getOperator(
    _: OperatorKind,
    __?: Maybe<IType>,
  ): Maybe<Operator<IType>> {
    return undefined;
  }
  public getOperators(): Map<OperatorKind, Operator<IType>[]> {
    return new Map();
  }
  public toString(): string {
    return `...${this.base.toString()}`;
  }
  public apply(_: IType | Map<IType, IType>): IType {
    return this;
  }
}
