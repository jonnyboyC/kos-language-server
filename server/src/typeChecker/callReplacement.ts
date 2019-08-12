import { TypeParameter } from './typeParameter';
import { IGenericType, IType, ICallSignature, TypeMap } from './types';
import { empty } from '../utilities/typeGuards';
import { CallSignature } from './types/callSignature';

export class CallReplacement {
  /**
   * A set of type parameters
   */
  public readonly typeParameters: TypeParameter[];

  /**
   * Mappings from placeholder types to type parameters
   */
  public readonly placeHolders: Map<IGenericType, TypeParameter>;

  /**
   * Cached substitutions
   */
  public replacementCache: Map<Map<IType, IType>, ICallSignature>;

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

    this.typeParameters = names.map(name => TypeParameter.create(name));
    this.placeHolders = new Map(
      this.typeParameters.map(typeP => [typeP.placeHolder, typeP]),
    );
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
    typeReplacements: Map<IType, IType>,
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
  private isValidReplacement(replacement: Map<IType, IType>): void {
    for (const [placeholder, typeParameter] of this.placeHolders.entries()) {
      if (!replacement.has(placeholder as IType)) {
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
    typeReplacement: Map<IType, IType>,
  ): Map<IType, IType> {
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
  private toConcrete(type: IGenericType, typeReplacement: Map<IType, IType>) {
    // check if type is actually a placeholder
    const typeParameter = this.placeHolders.get(type);

    if (!empty(typeParameter)) {
      // if found substitute the type placeholder with a real type
      const replacement = typeReplacement.get(typeParameter.placeHolder);
      if (empty(replacement)) {
        throw new Error(
          `Did not provide a type replacement for ${typeParameter.name}.`,
        );
      }

      return replacement;
    }

    // otherwise call the types to concrete method
    return type.toConcrete(typeReplacement);
  }

  /**
   * Map type replacement, to another type using the type parameter mapping
   * @param typeReplacement placeholder to replace with some other type
   * @param substitutionMap mapping of type parameters from a source type to a target type
   */
  private mapReplacement(
    typeReplacement: Map<IType, IType>,
    substitutionMap?: Map<TypeParameter, TypeParameter>,
  ): Map<IType, IType> {
    const mappedTypeReplacement: Map<IType, IType> = new Map();
    if (empty(substitutionMap)) {
      return mappedTypeReplacement;
    }

    for (const [placeholder, type] of typeReplacement) {
      // try to find type parameter from placeholders
      const typeParameter = this.placeHolders.get(placeholder);
      if (empty(typeParameter)) {
        throw new Error(
          `Could not find type parameter for ${placeholder.name}.`,
        );
      }

      // look up this type's type parameter in the link
      const mappedTypeParam = substitutionMap.get(typeParameter);
      if (empty(mappedTypeParam)) {
        throw new Error(
          `Could not find type parameter mapping of ${typeParameter.name}.`,
        );
      }

      // if found map super placeholder to the provided substitution
      mappedTypeReplacement.set(mappedTypeParam.placeHolder, type);
    }
    return mappedTypeReplacement;
  }
}
