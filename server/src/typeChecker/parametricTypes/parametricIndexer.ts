import {
  TypeMap,
  TypeKind,
  IParametricCallSignature,
  IType,
  IParametricIndexer,
  IIndexer,
  IParametricType,
} from '../types';
import { ParametricType } from './parametricType';
import { IndexerBinder } from '../binders/indexerBinder';
import { empty } from '../../utilities/typeGuards';

export class ParametricIndexer extends ParametricType
  implements IParametricIndexer {
  public readonly indexBinder: IndexerBinder;
  public readonly kind: TypeKind.indexer;

  constructor(typeParameters: string[]) {
    super(
      'Indexer',
      { get: true, set: true },
      typeParameters,
      TypeKind.indexer,
    );
    this.indexBinder = new IndexerBinder(typeParameters);
    this.kind = TypeKind.indexer;
  }

  /**
   * Add parameters to this call signature
   * @param indexMap index to add
   */
  public addCallSignature(callSignature: TypeMap<IParametricCallSignature>) {
    if (callSignature.type.params().length !== 1) {
      throw new Error(
        `Indexer can only have one parameter provided ${
          callSignature.type.params().length
        }`,
      );
    }

    super.addCallSignature(callSignature);
  }

  public getTypeParameters(): IParametricType[] {
    return [...this.indexBinder.typeParameters];
  }

  public apply(typeArguments: Map<IType, IType> | IType): IIndexer {
    if (empty(this.callSignature)) {
      throw new Error('Indexer call signature must be set');
    }

    if (typeArguments instanceof Map) {
      return this.indexBinder.apply(typeArguments, this.callSignature);
    }

    const typeParameters = this.getTypeParameters();
    if (typeParameters.length !== 1) {
      throw new Error(
        'Must provide a type map if more than one parameter is present.',
      );
    }
    return this.indexBinder.apply(
      new Map([[typeParameters[0], typeArguments]]),
      this.callSignature,
    );
  }
}
