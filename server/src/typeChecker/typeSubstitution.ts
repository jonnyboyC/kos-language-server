import { TypeParameter } from './typeParameter';
import { IGenericType, IType, CallSignature } from './types';
import { empty } from '../utilities/typeGuards';
import { Type } from './ksType';
import { Operator } from './operator';

export class TypeSubstitution {
  /**
   * A set of type parameters
   */
  public readonly typeParameters: TypeParameter[];

  /**
   * Mappings from placeholder types to type parameters
   */
  public readonly placeHolders: Map<IGenericType, TypeParameter>;

  /**
   * Cached substitution for a variety of type arguments
   */
  public substitutions: Map<Map<string, IType>, IType>;

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
    this.placeHolders = new Map();

    for (const typeParameter of this.typeParameters) {
      this.placeHolders.set(typeParameter.placeHolder, typeParameter);
    }

    this.substitutions = new Map();
  }

  /**
   * Substitute placeholder types in a generic for real one using the
   * provided type arguments
   * @param type the generic type to be made concrete
   * @param typeArguments the type arguments for th type
   * @param typeParameterLink the link between a type parameters of a sub type and super
   * type for example in typescript this is analogous to
   * `class Foo<T, S> extends Bar<S, T>`where the map describes the ordering
   */
  public substitute(
    type: IGenericType,
    typeArguments: Map<string, IType>,
    typeParameterLink?: Map<TypeParameter, TypeParameter>,
  ): IType {
    // check if type is actually a placeholder
    const typeParameter = this.placeHolders.get(type);

    if (!empty(typeParameter)) {
      // if found substitute the type parameter with type argument
      const substitution = typeArguments.get(typeParameter.name);
      if (empty(substitution)) {
        throw new Error(
          `Did not provide a type parameter for ${typeParameter.name}.`,
        );
      }

      return substitution;
    }

    // check if we've already performed this type replacement
    const cachedTypeArguments = this.getCachedArguments(typeArguments);
    const cache = this.substitutions.get(cachedTypeArguments);

    if (!empty(cache)) {
      return cache;
    }

    // update call signature
    let callSignature: Maybe<CallSignature<IType>> = undefined;
    if (!empty(type.callSignature)) {
      callSignature = {
        params: type.callSignature.params.map(p =>
          p.toConcreteType(cachedTypeArguments),
        ),
        returns: type.callSignature.returns.toConcreteType(cachedTypeArguments),
      };
    }

    // generate the new type
    const newType = new Type(
      type.name,
      type.access,
      type.getTypeParameters().map(x => x.name),
      cachedTypeArguments,
      type.kind,
      callSignature,
      type,
    );

    // cache earlier in case of cycles list<T>:copy -> list<T>
    this.substitutions.set(cachedTypeArguments, newType);

    const superType = type.getSuperType();

    // convert super
    if (!empty(superType)) {
      if (!empty(typeParameterLink)) {
        const mappedTypeArguments = this.mapTypeArguments(
          typeArguments,
          typeParameterLink,
        );
        newType.addSuper(superType.toConcreteType(mappedTypeArguments));
      } else {
        newType.addSuper(superType.toConcreteType(typeArguments));
      }
    }

    // convert suffixes
    for (const [, suffix] of type.getSuffixes()) {
      newType.addSuffixes(suffix.toConcreteType(typeArguments));
    }

    // convert coercions
    newType.addCoercion(
      ...Array.from(type.getCoercions()).map(c =>
        c.toConcreteType(typeArguments),
      ),
    );

    // convert operators
    for (const [kind, operators] of type.getOperators()) {
      for (const operator of operators) {
        const returnType = operator.returnType.toConcreteType(typeArguments);
        const otherOperand = empty(operator.otherOperand)
          ? undefined
          : operator.otherOperand.toConcreteType(typeArguments);

        newType.addOperators(
          new Operator<IType>(kind, returnType, otherOperand),
        );
      }
    }

    return newType;
  }

  /**
   * Map type arguments from this generic class to the super class
   * @param typeArguments type arguments for this substitution
   * @param typeParameterLink the mapping of type parameters from this type to it's
   * super type
   */
  private mapTypeArguments(
    typeArguments: Map<string, IType>,
    typeParameterLink: Map<TypeParameter, TypeParameter>,
  ) {
    const mappedTypeArguments = new Map<string, IType>();
    for (const [name, type] of typeArguments) {
      const typeParams = this.typeParameters.filter(
        param => param.name === name,
      );
      if (typeParams.length !== 1) {
        throw new Error(`Could not find type parameter ${name}.`);
      }
      const mappedTypeParam = typeParameterLink.get(typeParams[0]);
      if (empty(mappedTypeParam)) {
        throw new Error(`Could not find type parameter ${name}.`);
      }
      mappedTypeArguments.set(mappedTypeParam.name, type);
    }
    return mappedTypeArguments;
  }

  /**
   * linear search for keys using value comparison for matches
   * @param typeArguments type arguments for this substitution
   */
  private getCachedArguments(
    typeArguments: Map<string, IType>,
  ): Map<string, IType> {
    // see if we already have already have performed this substitution
    for (const cachedTypeArguments of this.substitutions.keys()) {
      let match = true;

      for (const [typeParameter, type] of cachedTypeArguments) {
        const typeSubstitution = typeArguments.get(typeParameter);
        if (empty(typeParameter) || typeSubstitution !== type) {
          match = false;
          break;
        }
      }

      if (match) {
        return cachedTypeArguments;
      }
    }

    // none found return argument
    return typeArguments;
  }
}
