import { TypeParameter } from './typeParameter';
import { IGenericType, IType, ICallSignature, TypeMap } from './types';
import { empty } from '../utilities/typeGuards';
import { Operator } from './operator';
import { noMap as noMapping } from './typeCreators';
import { GenericType } from './types/genericType';
import { Type } from './types/type';
import { GenericCallSignature } from './types/genericCallSignature';

export class TypeReplacement {
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
  public replacementCache: Map<Map<IType, IType>, IType>;

  /**
   * Construct a new type substitution
   * @param names names of the type for substituting
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
   * Substitute placeholder types in a generic for real one using the
   * provided type arguments
   * @param type the generic type to be made concrete
   * @param typeReplacement the type replacement to preform
   * @param callSignature the call signature and it's type mapping
   * @param suffixMap the collection of suffixes and their type mapping
   * @param superMap the super and it's type mapping
   */
  public replace(
    type: GenericType,
    typeReplacement: Map<IType, IType>,
    suffixMap: Map<string, TypeMap<IGenericType>>,
    callSignature?: TypeMap<GenericCallSignature>,
    superMap?: TypeMap<IGenericType>,
  ): IType {
    // check validity of the substitution
    this.isValidReplacement(typeReplacement);

    // check if we've already performed this type replacement
    const cachedTypeReplacement = this.getCachedTypeReplacements(
      typeReplacement,
    );
    const cache = this.replacementCache.get(cachedTypeReplacement);

    if (!empty(cache)) {
      return cache;
    }

    // update call signature
    let newCallSignature: Maybe<ICallSignature> = undefined;
    if (!empty(callSignature)) {
      const mappedCallReplacement = this.mapSubstitution(
        typeReplacement,
        callSignature.mapping,
      );

      newCallSignature = callSignature.type.toConcrete(mappedCallReplacement);
    }

    // generate the new type
    const newType = new Type(
      type.name,
      type.access,
      type.getTypeParameters().map(x => x.name),
      cachedTypeReplacement,
      type.kind,
      newCallSignature,
      type,
    );

    // cache earlier in case of cycles list<T>:copy -> list<T>
    this.replacementCache.set(cachedTypeReplacement, newType);

    // convert super
    if (!empty(superMap)) {
      const mappedSuperReplacement = this.mapSubstitution(
        typeReplacement,
        superMap.mapping,
      );
      newType.addSuper(
        noMapping(this.toConcrete(superMap.type, mappedSuperReplacement)),
      );
    }

    // convert suffixes
    for (const [, suffix] of suffixMap) {
      const mappedSuffixReplacement = this.mapSubstitution(
        typeReplacement,
        suffix.mapping,
      );

      newType.addSuffixes(
        noMapping(this.toConcrete(suffix.type, mappedSuffixReplacement)),
      );
    }

    // convert coercions
    newType.addCoercion(
      ...Array.from(type.getCoercions()).map(c =>
        this.toConcrete(c, typeReplacement),
      ),
    );

    // convert operators
    for (const [kind, operators] of type.getOperators()) {
      for (const operator of operators) {
        const returnType = this.toConcrete(
          operator.returnType,
          typeReplacement,
        );
        const otherOperand = empty(operator.otherOperand)
          ? undefined
          : this.toConcrete(operator.otherOperand, typeReplacement);

        newType.addOperators(
          new Operator<IType>(kind, returnType, otherOperand),
        );
      }
    }

    return newType;
  }

  /**
   * Check if the provided substitutions are valid
   * @param typeReplacement the requested type substitutions
   */
  private isValidReplacement(typeReplacement: Map<IType, IType>): void {
    for (const [placeholder, typeParameter] of this.placeHolders.entries()) {
      if (!typeReplacement.has(placeholder as IType)) {
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
  private getCachedTypeReplacements(
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
   * @param typeReplacements type replacements
   */
  private toConcrete(type: IGenericType, typeReplacements: Map<IType, IType>) {
    // check if type is actually a placeholder
    const typeParameter = this.placeHolders.get(type);

    if (!empty(typeParameter)) {
      // if found substitute the type placeholder with a real type
      const substitution = typeReplacements.get(typeParameter.placeHolder);
      if (empty(substitution)) {
        throw new Error(
          `Did not provide a type substitution for ${typeParameter.name}.`,
        );
      }

      return substitution;
    }

    // otherwise call the types to concrete method
    return type.toConcrete(typeReplacements);
  }

  /**
   * Map type substitutions, to another type using the type parameter mapping
   * @param typeReplacements placeholder to replace with some other type
   * @param replacementMap mapping of type parameters from a source type to a target type
   */
  private mapSubstitution(
    typeReplacements: Map<IType, IType>,
    replacementMap?: Map<TypeParameter, TypeParameter>,
  ): Map<IType, IType> {
    const mappedTypeReplacements: Map<IType, IType> = new Map();
    if (empty(replacementMap)) {
      return mappedTypeReplacements;
    }

    for (const [placeholder, type] of typeReplacements) {
      // try to find type parameter from placeholders
      const typeParameter = this.placeHolders.get(placeholder);
      if (empty(typeParameter)) {
        throw new Error(
          `Could not find type parameter for ${placeholder.name}.`,
        );
      }

      // look up this type's type parameter in the link
      const mappedTypeParam = replacementMap.get(typeParameter);
      if (empty(mappedTypeParam)) {
        throw new Error(
          `Could not find type parameter mapping of ${typeParameter.name}.`,
        );
      }

      // if found map super placeholder to the provided substitution
      mappedTypeReplacements.set(mappedTypeParam.placeHolder, type);
    }
    return mappedTypeReplacements;
  }
}
