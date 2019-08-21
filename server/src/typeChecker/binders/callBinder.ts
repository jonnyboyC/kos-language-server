import { IParametricType, IType, ICallSignature, TypeMap } from '../types';
import { empty } from '../../utilities/typeGuards';
import { CallSignature } from '../types/callSignature';
import { Binder } from './binder';

/**
 * A class that's responsible for binding type arguments to type
 * parameters of parametric call signatures
 */
export class CallBinder extends Binder<CallSignature> {
  /**
   * Construct a new call binder
   * @param names names of the types for substituting
   */
  constructor(names: string[]) {
    super(names);
  }

  /**
   * Apply type arguments to this parametric call signature to generate
   * a call signature
   * @param typeArguments the type arguments for this application
   * @param params the parameters for the generic call
   * @param returns the return of the generic call
   */
  public apply(
    typeArguments: Map<IParametricType, IType>,
    params: TypeMap<IParametricType>[],
    returns: TypeMap<IParametricType>,
  ): ICallSignature {
    // check validity of the substitution
    this.areValidArguments(typeArguments);

    // check if we've already performed this type replacement
    const cachedTypeSubstitutions = this.getCachedArguments(typeArguments);
    const cache = this.applicationCache.get(cachedTypeSubstitutions);

    if (!empty(cache)) {
      return cache;
    }

    const newParams: IType[] = [];

    // convert params
    for (const param of params) {
      const mappedParamSubstitutions = this.mapArguments(
        typeArguments,
        param.mapping,
      );

      newParams.push(this.applyToType(param.type, mappedParamSubstitutions));
    }

    const mappedReturnsSubstitutions = this.mapArguments(
      typeArguments,
      returns.mapping,
    );
    const newReturns = this.applyToType(
      returns.type,
      mappedReturnsSubstitutions,
    );

    // generate the new type
    const newCall = new CallSignature(newParams, newReturns);

    // cache substitution
    this.applicationCache.set(cachedTypeSubstitutions, newCall);
    return newCall;
  }
}
