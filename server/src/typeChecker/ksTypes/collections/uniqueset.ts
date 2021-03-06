import {
  createParametricType,
  createParametricArgSuffixType,
  mapTypes,
} from '../../utilities/typeCreators';
import { noneType } from '../primitives/none';
import { collectionType } from './enumerable';
import { booleanType } from '../primitives/boolean';

export const uniqueSetType = createParametricType('uniqueSet', ['T']);
uniqueSetType.addSuper(mapTypes(uniqueSetType, collectionType));

const copySuffix = createParametricArgSuffixType('copy', ['T'], uniqueSetType);
const addSuffix = createParametricArgSuffixType('add', ['T'], noneType, 'T');
const removeSuffix = createParametricArgSuffixType(
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
