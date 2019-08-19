import { ICallSignature, IType, IGenericType } from '../types';

export class CallSignature implements ICallSignature {
  public name: string;

  private readonly paramTypes: IType[];
  private readonly returnType: IType;
  constructor(paramTypes: IType[], returnType: IType) {
    this.name = 'Call Signature';
    this.paramTypes = paramTypes;
    this.returnType = returnType;
  }
  public params() {
    return this.paramTypes;
  }
  public returns() {
    return this.returnType;
  }
  public toConcrete(_: IType | Map<IType, IType>): ICallSignature {
    return this;
  }
  public getTypeParameters(): IGenericType[] {
    return [];
  }
  public toTypeString(): string {
    const paramsStr = this.params()
      .map(p => p.toTypeString())
      .join(', ');

    return `(${paramsStr}) => ${this.returns().toTypeString()}`;
  }
}
