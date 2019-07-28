import { TypeParameter } from './typeParameter';
import { IGenericType, IType } from './types';
import { empty } from '../utilities/typeGuards';

export class TypeSubstitution {
  public readonly typeParameters: Set<TypeParameter>;
  public substitutionCache: Map<Map<TypeParameter, IType>, IType>;

  constructor(typeParameters: Set<TypeParameter>) {
    this.typeParameters = typeParameters;
    this.substitutionCache = new Map();
  }

  public substitute(
    type: IGenericType,
    typeArguments: Map<TypeParameter, IType>,
  ): IType {
    const cachedTypeArguments = this.getCachedArguments(typeArguments);
  }

  private getCachedArguments(
    typeArguments: Map<TypeParameter, IType>,
  ): Map<TypeParameter, IType> {
    // see if we already have already have performed this substitution
    for (const cachedTypeArguments of this.substitutionCache.keys()) {
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
