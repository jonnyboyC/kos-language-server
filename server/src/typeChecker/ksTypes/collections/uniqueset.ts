import {
  createGenericStructureType,
  createGenericArgSuffixType,
  mapTypes,
} from '../../typeCreators';
import { voidType } from '../primitives/void';
import { collectionType } from './enumerable';
import { booleanType } from '../primitives/boolean';

export const uniqueSetType = createGenericStructureType('uniqueSet', ['T']);
uniqueSetType.addSuper(mapTypes(uniqueSetType, collectionType));

const copySuffix = createGenericArgSuffixType('copy', ['T'], uniqueSetType);
const addSuffix = createGenericArgSuffixType('add', ['T'], voidType, 'T');
const removeSuffix = createGenericArgSuffixType(
  'remove',
  ['T'],
  booleanType,
  'T',
);

uniqueSetType.addSuffixes(
  mapTypes(uniqueSetType, copySuffix),
  mapTypes(uniqueSetType, addSuffix),
  mapTypes(uniqueSetType, removeSuffix),
);
