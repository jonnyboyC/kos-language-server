import {
  IType,
  Access,
  TypeKind,
  TypeMap,
  ICallSignature,
  OperatorKind,
} from '../types';
import { Operator } from '../operator';
import { TypeParameter } from '../typeParameter';
import { TypeTracker } from '../../analysis/typeTracker';

export class VariadicType implements IType {
  typeSubstitutions: Map<IType, IType>;
  anyType: boolean;
  base: IType;
  name: string;
  access: Access;
  kind: TypeKind;

  constructor(base: IType) {
    this.base = base;
    this.name = base.name;
    this.access = { get: false, set: false };
    this.kind = TypeKind.variadic;
    this.anyType = false;
    this.typeSubstitutions = new Map();
  }

  public addSuper(_: TypeMap<IType>): void {
    throw new Error('Method not implemented.');
  }
  public addCoercion(..._: IType[]): void {
    throw new Error('Method not implemented.');
  }
  public addSuffixes(..._: TypeMap<IType>[]): void {
    throw new Error('Method not implemented.');
  }
  public addOperators(..._: Operator<IType>[]): void {
    throw new Error('Method not implemented.');
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
  public getTypeParameters(): TypeParameter[] {
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
  public getSuffix(_: string): Maybe<IType> {
    return undefined;
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
  public toTypeString(): string {
    return `...${this.base.toTypeString()}`;
  }
  public toConcrete(_: IType | Map<IType, IType>): IType {
    return this;
  }
}
