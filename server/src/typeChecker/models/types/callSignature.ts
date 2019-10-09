import { ICallSignature, IType, IParametricType } from '../../types';

/**
 * This call represents a call signature for a type. This could likely be rolled up into
 * the overarching type classes but allowed some means of separation
 */
export class CallSignature implements ICallSignature {
  /**
   * primarily used as part of the ITypeMappable interface
   */
  public readonly name: string;

  /**
   * The type associated with the parameters of this call signature if any
   */
  private readonly paramTypes: IType[];

  /**
   * The return type associated with this call signature
   */
  private readonly returnType: IType;

  /**
   * Construct a new call signature
   * @param paramTypes call parameter types
   * @param returnType call return type
   */
  constructor(paramTypes: IType[], returnType: IType) {
    this.name = 'Call Signature';
    this.paramTypes = paramTypes;
    this.returnType = returnType;
  }

  /**
   * Get the parameters of this call signature
   */
  public params() {
    return this.paramTypes;
  }

  /**
   * Get the return of this call signature
   */
  public returns() {
    return this.returnType;
  }

  /**
   * Get type parameters of this call signature
   */
  public getTypeParameters(): IParametricType[] {
    return [];
  }

  /**
   * Apply type arguments to this call signature
   * @param _ type arguments
   */
  public apply(_: IType | Map<IType, IType>): ICallSignature {
    return this;
  }

  /**
   * Get a string representation of this call signature
   */
  public toString(): string {
    const paramsStr = this.params()
      .map(p => p.toString())
      .join(', ');

    return `(${paramsStr}) => ${this.returns().toString()}`;
  }
}
