import {
  IParametricType,
  IType,
  TypeMap,
  IParametricCallSignature,
} from '../types';
import { empty } from '../../utilities/typeGuards';
import { Binder } from './binder';
import { Indexer } from '../models/types/indexer';

/**
 * A class that's responsible for binding type arguments to type
 * parameters of parametric call signatures
 */
export class IndexerBinder extends Binder<Indexer> {
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
   * @param callSignature call signature of indexer
   */
  public apply(
    typeArguments: Map<IParametricType, IType>,
    callSignature: TypeMap<IParametricCallSignature>,
  ): Indexer {
    // check validity of the substitution
    this.areValidArguments(typeArguments);

    // check if we've already performed this type replacement
    const cachedTypeSubstitutions = this.getCachedArguments(typeArguments);
    const cache = this.applicationCache.get(cachedTypeSubstitutions);

    if (!empty(cache)) {
      return cache;
    }

    const mappedCallReplacement = this.mapArguments(
      typeArguments,
      callSignature.mapping,
    );

    const newCallSignature = callSignature.type.apply(mappedCallReplacement);

    // generate the new type
    const newIndexer = new Indexer(newCallSignature, typeArguments);

    // cache application
    this.applicationCache.set(cachedTypeSubstitutions, newIndexer);
    return newIndexer;
  }
}
