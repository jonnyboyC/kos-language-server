import {
  IParametricType,
  IType,
  ICallSignature,
  TypeMap,
  IParametricCallSignature,
  IIndexer,
} from '../types';
import { empty } from '../../utilities/typeGuards';
import { Operator } from '../types/operator';
import { noMap } from '../typeCreators';
import { ParametricType } from '../parametricTypes/parametricType';
import { Type } from '../types/type';
import { Binder } from './binder';

/**
 * A class that is responsible for binding type arguments to type parameters in
 * parametric types
 */
export class TypeBinder extends Binder<Type> {
  /**
   * Construct a new type binder
   * @param names names of the type for substituting
   */
  constructor(names: string[]) {
    super(names);
  }

  /**
   * Substitute placeholder types in a generic for real one using the
   * provided type arguments
   * @param type the generic type to be made concrete
   * @param typeArguments the type replacement to preform
   * @param callSignature the call signature and it's type mapping
   * @param suffixes the collection of suffixes and their type mapping
   * @param superMap the super and it's type mapping
   */
  public apply(
    type: ParametricType,
    typeArguments: Map<IParametricType, IType>,
    suffixes: Map<string, TypeMap<IParametricType>>,
    callSignature?: TypeMap<IParametricCallSignature>,
    superMap?: TypeMap<IParametricType>,
    indexerMap?: TypeMap<IParametricType>,
  ): IType {
    // check validity of the substitution
    this.areValidArguments(typeArguments);

    // check if we've already performed this type replacement
    const cachedTypeReplacement = this.getCachedArguments(typeArguments);
    const cache = this.applicationCache.get(cachedTypeReplacement);

    if (!empty(cache)) {
      return cache;
    }

    // update call signature
    let newCallSignature: Maybe<ICallSignature> = undefined;
    if (!empty(callSignature)) {
      const mappedCallReplacement = this.mapArguments(
        typeArguments,
        callSignature.mapping,
      );

      newCallSignature = callSignature.type.apply(mappedCallReplacement);
    }

    // generate the new type
    const newType = new Type(
      type.name,
      type.access,
      cachedTypeReplacement,
      type.kind,
      newCallSignature,
      type,
    );

    // cache earlier in case of cycles list<T>:copy -> list<T>
    this.applicationCache.set(cachedTypeReplacement, newType);

    // convert super
    if (!empty(superMap)) {
      const mappedSuperReplacement = this.mapArguments(
        typeArguments,
        superMap.mapping,
      );
      newType.addSuper(
        noMap(this.applyToType(superMap.type, mappedSuperReplacement)),
      );
    }

    // convert super
    if (!empty(indexerMap)) {
      const mappedIndxerArguments = this.mapArguments(
        typeArguments,
        indexerMap.mapping,
      );
      newType.addIndexer(
        noMap(indexerMap.type.apply(mappedIndxerArguments) as IIndexer),
      );
    }

    // convert suffixes
    for (const [, suffix] of suffixes) {
      const mappedSuffixReplacement = this.mapArguments(
        typeArguments,
        suffix.mapping,
      );

      newType.addSuffixes(
        noMap(this.applyToType(suffix.type, mappedSuffixReplacement)),
      );
    }

    // convert coercions
    newType.addCoercion(
      ...Array.from(type.getCoercions()).map(c =>
        this.applyToType(c, typeArguments),
      ),
    );

    // convert operators
    for (const [kind, operators] of type.getOperators()) {
      for (const operator of operators) {
        const returnType = this.applyToType(operator.returnType, typeArguments);

        const firstOperand = this.applyToType(
          operator.firstOperand,
          typeArguments,
        );

        const secondOperand = empty(operator.secondOperand)
          ? undefined
          : this.applyToType(operator.secondOperand, typeArguments);

        newType.addOperators(
          new Operator<IType>(firstOperand, kind, returnType, secondOperand),
        );
      }
    }

    return newType;
  }
}
