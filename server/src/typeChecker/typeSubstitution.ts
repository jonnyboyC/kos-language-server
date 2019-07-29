import { TypeParameter } from './typeParameter';
import { IGenericType, IType, CallSignature } from './types';
import { empty } from '../utilities/typeGuards';
import { Type, SuffixType } from './ksType';
import { Operator } from './operator';

export class TypeSubstitution {
  /**
   *
   */
  public readonly typeParameters: Set<TypeParameter>;

  /**
   *
   */
  public readonly placeHolders: Map<IGenericType, TypeParameter>;

  /**
   *
   */
  public substitutions: Map<Map<TypeParameter, IType>, IType>;

  /**
   *
   * @param names
   */
  constructor(names: Set<string>) {
    this.typeParameters = TypeParameter.toTypeParameters(names);
    this.placeHolders = new Map();

    for (const typeParameter of this.typeParameters) {
      this.placeHolders.set(typeParameter.placeHolder, typeParameter);
    }

    this.substitutions = new Map();
  }

  /**
   *
   * @param type
   * @param typeArguments
   */
  public substitute(
    type: IGenericType,
    typeArguments: Map<TypeParameter, IType>,
  ): IType {
    // check if type is actually a placeholder
    const typeParameter = this.placeHolders.get(type);

    if (!empty(typeParameter)) {
      // if found substitute the type parameter with type argument
      const substitution = typeArguments.get(typeParameter);
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

    const newType = new Type(
      type.name,
      type.access,
      cachedTypeArguments,
      type.kind,
      callSignature,
    );

    const superType = type.getSuperType();

    // convert super
    if (!empty(superType)) {
      newType.addSuper(superType.toConcreteType(typeArguments));
    }

    // convert suffixes
    for (const [name, suffix] of type.getSuffixes()) {
      newType.addSuffixes([name, suffix.toConcreteType(typeArguments)]);
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

        newType.addOperator([
          kind,
          new Operator<IType>(kind, returnType, otherOperand),
        ]);
      }
    }

    return newType;
  }

  /**
   *
   * @param typeArguments
   */
  private getCachedArguments(
    typeArguments: Map<TypeParameter, IType>,
  ): Map<TypeParameter, IType> {
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
