import {
  createArgSuffixType,
  createGenericStructureType,
  noMap,
  mapTypes,
  createGenericArgSuffixType,
} from '../../typeCreators';
import { enumeratorType } from './enumerator';
import { iterator } from '../../../utilities/constants';
import { integerType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';
import { voidType } from '../primitives/void';
import { serializableType } from '../primitives/serializeableStructure';

export const enumerableType = createGenericStructureType('enumerable', ['T']);
enumerableType.addSuper(noMap(serializableType));

const containsSuffix = createGenericArgSuffixType(
  'contains',
  ['T'],
  booleanType,
  'T',
);
const enumeratorSuffix = createGenericArgSuffixType(
  iterator,
  ['T'],
  enumeratorType,
);
const reverseEnumeratorSuffix = createGenericArgSuffixType(
  'reverseIterator',
  ['T'],
  enumeratorType,
);

enumerableType.addSuffixes(
  mapTypes(enumerableType, containsSuffix),
  mapTypes(enumerableType, enumeratorSuffix),
  mapTypes(enumerableType, reverseEnumeratorSuffix),
  noMap(createArgSuffixType('length', integerType)),
  noMap(createArgSuffixType('empty', booleanType)),
  noMap(createArgSuffixType('dump', stringType)),
);

export const collectionType = createGenericStructureType('collection', ['T']);
collectionType.addSuper(mapTypes(collectionType, enumerableType));

collectionType.addSuffixes(noMap(createArgSuffixType('clear', voidType)));
