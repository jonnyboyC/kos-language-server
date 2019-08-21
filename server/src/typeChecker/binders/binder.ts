import { IParametricType, IType, ITypeMappable } from '../types';
import { empty } from '../../utilities/typeGuards';
import { createPlaceholder } from '../typeCreators';

/**
 * A class that's responsible for binding type arguments to type
 * parameters of parametric call signatures
 */
export class Binder<T extends ITypeMappable> {
  /**
   * A set of type parameters
   */
  public readonly typeParameters: Set<IParametricType>;

  /**
   * Cached type application
   */
  public applicationCache: Map<Map<IParametricType, IType>, T>;

  /**
   * Construct a new binder
   * @param names names of the types for substituting
   */
  constructor(names: string[]) {
    if (new Set(names).size !== names.length) {
      throw new Error(
        `Type parameter must have unique names. Provided ${names.join(', ')}`,
      );
    }

    this.typeParameters = new Set(names.map(name => createPlaceholder(name)));
    this.applicationCache = new Map();
  }

  /**
   * Check if the provided replacement are valid
   * @param typeArguments the requested type substitutions
   */
  protected areValidArguments(typeArguments: Map<ITypeMappable, IType>): void {
    for (const typeParameter of this.typeParameters) {
      if (!typeArguments.has(typeParameter)) {
        throw new Error(
          `Provided arguments does not have a type for type parameter ${
            typeParameter.name
          }`,
        );
      }
    }
  }

  /**
   * Get the cached type arguments to preserve reference equality
   * @param typeReplacement placeholder for type subs
   */
  protected getCachedArguments(
    typeReplacement: Map<IParametricType, IType>,
  ): Map<IParametricType, IType> {
    for (const cachedReplacement of this.applicationCache.keys()) {
      if (cachedReplacement.size !== typeReplacement.size) {
        continue;
      }

      let match = true;
      for (const [key, value] of cachedReplacement.entries()) {
        const found = typeReplacement.get(key);

        if (found !== value) {
          match = false;
          break;
        }
      }

      if (match) {
        return cachedReplacement;
      }
    }

    return typeReplacement;
  }

  /**
   * Apply type arguments to this type
   * @param type type to make concrete
   * @param typeArguments type replacement
   */
  protected applyToType(
    type: IParametricType,
    typeArguments: Map<IParametricType, IType>,
  ) {
    // check if type is actually a parameter
    if (this.typeParameters.has(type as any)) {
      // if found get arguments for parameter
      const argument = typeArguments.get(type as any);
      if (empty(argument)) {
        throw new Error(
          `Did not provide a type argument for type parameter for ${
            type.name
          }.`,
        );
      }

      return argument;
    }

    // otherwise apply arguments to type
    return type.apply(typeArguments);
  }

  /**
   * Map type argument from this type to one of it's children
   * @param typeArguments type arguments for this type
   * @param parameterMap mapping of type parameters from a source type to a target type
   */
  protected mapArguments(
    typeArguments: Map<IParametricType, IType>,
    parameterMap: Map<IParametricType, IParametricType>,
  ): Map<IParametricType, IType> {
    if (parameterMap.size === 0) {
      return typeArguments;
    }
    const mappedTypeReplacement: Map<IParametricType, IType> = new Map();

    for (const [generic, type] of typeArguments) {
      // try to find type parameter from placeholders
      if (!this.typeParameters.has(generic)) {
        throw new Error(`Could not find type parameter for ${generic.name}.`);
      }

      // look up this type's type parameter in the link
      const mappedTypeParam = parameterMap.get(generic);
      if (empty(mappedTypeParam)) {
        throw new Error(
          `Could not find type parameter mapping of ${generic.name}.`,
        );
      }

      // if found map super placeholder to the provided substitution
      mappedTypeReplacement.set(mappedTypeParam, type);
    }
    return mappedTypeReplacement;
  }
}
