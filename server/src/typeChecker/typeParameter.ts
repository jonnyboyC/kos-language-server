import { IType, TypeKind } from './types';
import { Type } from './ksType';

/**
 * A class to represent a type parameter in a generic type
 */
export class TypeParameter {
  /**
   * What is the name of this type parameter
   */
  public readonly name: string;

  /**
   * What is the placeholder type
   */
  public readonly placeHolder: IType;

  /**
   * Construct a new type parameter
   * @param name name of the parameter
   * @param placeHolder the placeholder type
   */
  private constructor(name: string, placeHolder: IType) {
    this.name = name;
    this.placeHolder = placeHolder;
  }

  /**
   * Get a type string for this type parameter
   */
  public toTypeString(): string {
    return this.name;
  }

  /**
   * Generate a set of type parameters from a set of provided names
   * @param names names of type parameters
   */
  static toTypeParameters(names: Set<string>): Set<TypeParameter> {
    const typeParameters = new Set<TypeParameter>();

    // generate a type parameter from each name provided
    for (const name of names) {
      typeParameters.add(
        new TypeParameter(
          name,
          new Type(
            name,
            { get: true, set: true },
            new Map(),
            TypeKind.typePlaceholder,
          ),
        ),
      );
    }

    return typeParameters;
  }
}
