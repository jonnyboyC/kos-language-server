import { Access, IType, TypeKind, ICallSignature, IGenericType } from '../types';
import { Type } from './type';

/**
 * Represents a constant type, or a type with a fixed value
 */
export class ConstantType<T> extends Type {
  public readonly value: T;

  /**
   * Construct a constant type
   * @param name name of this constant type
   * @param value value of this constant type
   */
  constructor(
    name: string,
    value: T,
    access: Access,
    typeParameters: string[],
    typeArguments: Map<IType, IType>,
    kind: TypeKind,
    callSignature?: ICallSignature,
    typeTemplate?: IGenericType,
  ) {
    super(
      name,
      access,
      typeParameters,
      typeArguments,
      kind,
      callSignature,
      typeTemplate,
    );
    this.value = value;
  }

  /**
   * Create a type string from this type
   */
  public toTypeString(): string {
    return `${super.toTypeString()} = ${this.value}`;
  }
}
