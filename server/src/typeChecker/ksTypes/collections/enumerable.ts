import {
  createArgSuffixType,
  createGenericStructureType,
  createGenericArgSuffixType,
  noMap,
  passThroughMap,
} from '../../typeCreators';
import { enumeratorType } from './enumerator';
import { iterator } from '../../../utilities/constants';
import { integerType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';
import { voidType } from '../primitives/void';
import { serializableType } from '../primitives/serializeableStructure';

export const enumerableType = createGenericStructureType('enumerable');
enumerableType.addSuper(noMap(serializableType));
const typeParameters = enumerableType.getTypeParameters();

enumerableType.addSuffixes(
  passThroughMap(
    enumerableType,
    createGenericArgSuffixType(
      'contains',
      booleanType,
      typeParameters[0].placeHolder,
    ),
  ),
  passThroughMap(
    enumerableType,
    createGenericArgSuffixType(iterator, enumeratorType),
  ),
  passThroughMap(
    enumerableType,
    createGenericArgSuffixType('reverseIterator', enumeratorType),
  ),
  noMap(createArgSuffixType('length', integerType)),
  noMap(createArgSuffixType('empty', booleanType)),
  noMap(createArgSuffixType('dump', stringType)),
);

export const collectionType = createGenericStructureType('collection');
collectionType.addSuper(passThroughMap(enumerableType, collectionType));

collectionType.addSuffixes(noMap(createArgSuffixType('clear', voidType)));
