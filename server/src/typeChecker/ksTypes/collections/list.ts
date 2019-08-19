import {
  createArgSuffixType,
  createGenericStructureType,
  createGenericArgSuffixType,
  noMap,
  mapTypes,
} from '../../typeCreators';
import { voidType } from '../primitives/void';
import { scalarType, integerType } from '../primitives/scalar';
import { collectionType } from './enumerable';
import { stringType } from '../primitives/string';

export const listType = createGenericStructureType('list', ['T']);
listType.addSuper(mapTypes(listType, collectionType));

const addSuffix = createGenericArgSuffixType('add', ['T'], voidType, 'T');
const insertSuffix = createGenericArgSuffixType(
  'insert',
  ['T'],
  voidType,
  scalarType,
  'T',
);
const indexOfSuffix = createGenericArgSuffixType(
  'indexOf',
  ['T'],
  integerType,
  'T',
);
const findSuffix = createGenericArgSuffixType('find', ['T'], integerType, 'T');
const lastIndexOfSuffix = createGenericArgSuffixType(
  'lastIndexOf',
  ['T'],
  integerType,
  'T',
);
const findLastSuffix = createGenericArgSuffixType(
  'findLast',
  ['T'],
  integerType,
  'T',
);
const subListSuffix = createGenericArgSuffixType(
  'sublist',
  ['T'],
  listType,
  scalarType,
  scalarType,
);
const copySuffix = createGenericArgSuffixType('copy', ['T'], listType);

listType.addSuffixes(
  mapTypes(listType, copySuffix),
  mapTypes(listType, addSuffix),
  mapTypes(listType, insertSuffix),
  noMap(createArgSuffixType('remove', voidType, scalarType)),
  mapTypes(listType, subListSuffix),
  noMap(createArgSuffixType('join', stringType, stringType)),
  mapTypes(listType, indexOfSuffix),
  mapTypes(listType, findSuffix),
  mapTypes(listType, lastIndexOfSuffix),
  mapTypes(listType, findLastSuffix),
);
