import {
  Access,
  IType,
  TypeKind,
  ICallSignature,
  IParametricType,
} from '../types';
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
    typeArguments: Map<IType, IType>,
    kind: TypeKind,
    callSignature?: ICallSignature,
    typeTemplate?: IParametricType,
  ) {
    super(name, access, typeArguments, kind, callSignature, typeTemplate);
    this.value = value;
  }

  /**
   * Create a type string from this type
   */
  public toString(): string {
    return `${super.toString()} = ${this.value}`;
  }
}
