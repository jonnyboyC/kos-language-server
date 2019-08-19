import { TypeParameter } from './typeParameter';
import { IGenericType, IType, ICallSignature, TypeMap } from './types';
import { empty } from '../utilities/typeGuards';
import { CallSignature } from './types/callSignature';
import { createPlaceholder } from './typeCreators';

export class CallReplacement {
  /**
   * A set of type parameters
   */
  public readonly typeParameters: Set<IGenericType>;

  /**
   * Cached substitutions
   */
  public replacementCache: Map<Map<IGenericType, IType>, ICallSignature>;

  /**
   * Construct a new call substitution
   * @param names names of the types for substituting
   */
  constructor(names: string[]) {
    if (new Set(names).size !== names.length) {
      throw new Error(
        `Type parameter must have unique names. Provided ${names.join(', ')}`,
      );
    }

    this.typeParameters = new Set(names.map(name => createPlaceholder(name)));
    this.replacementCache = new Map();
  }

  /**
   * Replace placeholder types in a generic call signature for real one using the
   * provided type replacements
   * @param typeReplacements the type replacements to preform
   * @param params the parameters for the generic call
   * @param returns the return of the generic call
   */
  public replace(
    typeReplacements: Map<IGenericType, IType>,
    params: TypeMap<IGenericType>[],
    returns: TypeMap<IGenericType>,
  ): ICallSignature {
    // check validity of the substitution
    this.isValidReplacement(typeReplacements);

    // check if we've already performed this type replacement
    const cachedTypeSubstitutions = this.getCachedReplacements(
      typeReplacements,
    );
    const cache = this.replacementCache.get(cachedTypeSubstitutions);

    if (!empty(cache)) {
      return cache;
    }

    const newParams: IType[] = [];

    // convert params
    for (const param of params) {
      const mappedParamSubstitutions = this.mapReplacement(
        typeReplacements,
        param.mapping,
      );

      newParams.push(this.toConcrete(param.type, mappedParamSubstitutions));
    }

    const mappedReturnsSubstitutions = this.mapReplacement(
      typeReplacements,
      returns.mapping,
    );
    const newReturns = this.toConcrete(
      returns.type,
      mappedReturnsSubstitutions,
    );

    // generate the new type
    const newCall = new CallSignature(newParams, newReturns);

    // cache substitution
    this.replacementCache.set(cachedTypeSubstitutions, newCall);
    return newCall;
  }

  /**
   * Check if the provided replacement are valid
   * @param replacement the requested type substitutions
   */
  private isValidReplacement(replacement: Map<TypeParameter, IType>): void {
    for (const typeParameter of this.typeParameters) {
      if (!replacement.has(typeParameter)) {
        throw new Error(
          `Provided replacements does not have a type for ${
            typeParameter.name
          }`,
        );
      }
    }
  }

  /**
   * Get the cached type substitution to preserve reference equality
   * @param typeReplacement placeholder for type subs
   */
  private getCachedReplacements(
    typeReplacement: Map<IGenericType, IType>,
  ): Map<IGenericType, IType> {
    for (const cachedReplacement of this.replacementCache.keys()) {
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
   * Convert a type to it's concrete form using the provided substitutions
   * @param type type to make concrete
   * @param typeReplacement type replacement
   */
  private toConcrete(
    type: IGenericType,
    typeReplacement: Map<IGenericType, IType>,
  ) {
    // check if type is actually a placeholder

    if (this.typeParameters.has(type)) {
      // if found substitute the type placeholder with a real type
      const replacement = typeReplacement.get(type);
      if (empty(replacement)) {
        throw new Error(`Did not provide a type replacement for ${type.name}.`);
      }

      return replacement;
    }

    // otherwise call the types to concrete method
    return type.toConcrete(typeReplacement);
  }

  /**
   * Map type replacement, to another type using the type parameter mapping
   * @param typeReplacement placeholder to replace with some other type
   * @param replacementMap mapping of type parameters from a source type to a target type
   */
  private mapReplacement(
    typeReplacement: Map<IGenericType, IType>,
    replacementMap: Map<IGenericType, IGenericType>,
  ): Map<IGenericType, IType> {
    if (replacementMap.size === 0) {
      return typeReplacement;
    }
    const mappedTypeReplacement: Map<IGenericType, IType> = new Map();

    for (const [generic, type] of typeReplacement) {
      // try to find type parameter from placeholders
      if (!this.typeParameters.has(generic)) {
        throw new Error(`Could not find type parameter for ${generic.name}.`);
      }

      // look up this type's type parameter in the link
      const mappedTypeParam = replacementMap.get(generic);
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
