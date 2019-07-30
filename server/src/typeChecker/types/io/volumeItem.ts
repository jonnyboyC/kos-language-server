import { createStructureType, createSuffixType } from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { stringType } from '../primitives/string';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';

export const volumeItemType = createStructureType('volumeitem');
volumeItemType.addSuper(structureType);

volumeItemType.addSuffixes(
  createSuffixType('name', stringType),
  createSuffixType('size', scalarType),
  createSuffixType('extension', stringType),
  createSuffixType('isfile', booleanType),
);
