import {
  IType,
  Access,
  TypeKind,
  TypeMap,
  ICallSignature,
  OperatorKind,
  IGenericType,
} from '../types';
import { Operator } from '../operator';
import { TypeTracker } from '../../analysis/typeTracker';

export class PlaceholderType implements IType {
  typeSubstitutions: Map<IType, IType>;
  anyType: boolean;
  name: string;
  access: Access;
  kind: TypeKind;

  constructor(name: string) {
    this.name = name;
    this.access = { get: false, set: false };
    this.kind = TypeKind.typePlaceholder;
    this.anyType = false;
    this.typeSubstitutions = new Map();
  }
  public addSuper(_: TypeMap<IType>): void {
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
  public addCoercion(..._: IType[]): void {
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
  public addSuffixes(..._: TypeMap<IType>[]): void {
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
  public addOperators(..._: Operator<IType>[]): void {
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
  public isSubtypeOf(_: IType): boolean {
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
  public canCoerceFrom(_: IType): boolean {
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
  public getAssignmentType(): IType {
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
  public getTypeParameters(): IGenericType[] {
    debugger;
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
  public getSuperType(): Maybe<IType> {
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
  public getCallSignature(): Maybe<ICallSignature> {
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
  public getTracker(): TypeTracker {
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
  public getCoercions(): Set<IType> {
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
  public getSuffix(_: string): Maybe<IType> {
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
  public getSuffixes(): Map<string, IType> {
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
  public getOperator(
    _: OperatorKind,
    __?: Maybe<IType>,
  ): Maybe<Operator<IType>> {
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
  public getOperators(): Map<OperatorKind, Operator<IType>[]> {
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
  public toTypeString(): string {
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
  public toConcrete(_: IType | Map<IType, IType>): IType {
    throw new Error('Attempted to operate on type parameter placeholder.');
  }
}
