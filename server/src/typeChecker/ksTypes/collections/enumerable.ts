import {
  createArgSuffixType,
  createParametricType,
  noMap,
  mapTypes,
  createParametricArgSuffixType,
} from '../../typeCreators';
import { enumeratorType } from './enumerator';
import { iterator } from '../../../utilities/constants';
import { integerType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';
import { voidType } from '../primitives/void';
import { serializableType } from '../primitives/serializeableStructure';

export const enumerableType = createParametricType('enumerable', ['T']);
enumerableType.addSuper(noMap(serializableType));

const containsSuffix = createParametricArgSuffixType(
  'contains',
  ['T'],
  booleanType,
  'T',
);
const enumeratorSuffix = createParametricArgSuffixType(
  iterator,
  ['T'],
  enumeratorType,
);
const reverseEnumeratorSuffix = createParametricArgSuffixType(
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

export const collectionType = createParametricType('collection', ['T']);
collectionType.addSuper(mapTypes(collectionType, enumerableType));

collectionType.addSuffixes(noMap(createArgSuffixType('clear', voidType)));
