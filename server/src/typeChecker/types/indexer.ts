import {
  IParametricType,
  IType,
  TypeKind,
  ICallSignature,
  IIndexer,
} from '../types';
import { Type } from './type';
import { empty } from '../../utilities/typeGuards';

export class Indexer extends Type implements IIndexer {
  public readonly kind: TypeKind.indexer;

  constructor(
    callSignature: ICallSignature,
    typeArgument: Map<IParametricType, IType>,
  ) {
    super(
      'Indexer',
      { get: true, set: true },
      typeArgument,
      TypeKind.indexer,
      callSignature,
      undefined,
      false,
    );

    this.kind = TypeKind.indexer;
  }

  public toString(): string {
    const callSignature = this.callSignature();
    if (empty(callSignature)) {
      throw new Error('Indexer somehow has empty call signature');
    }

    const [index] = callSignature.params();
    const returns = callSignature.returns();

    return `[${index.toString()}] => ${returns.toString()}`;
  }

  public apply(_: Map<IType, IType> | IType): IIndexer {
    return this;
  }
}
