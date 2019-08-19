/**
 * A class to represent a type parameter in a generic type
 */
export class TypeParameter {
  /**
   * What is the name of this type parameter
   */
  public readonly name: string;

  /**
   * Construct a new type parameter
   * @param name name of the parameter
   * @param placeHolder the placeholder type
   */
  public constructor(name: string) {
    this.name = name;
  }

  /**
   * Get a type string for this type parameter
   */
  public toTypeString(): string {
    return this.name;
  }
}
