import { createStructureType, createSetSuffixType } from '../typeCreators';
import { structureType } from './primitives/structure';
import { scalarType } from './primitives/scalar';

export const situationLoadDistanceType = createStructureType(
  'situationLoadDistance',
);
situationLoadDistanceType.addSuper(structureType);

situationLoadDistanceType.addSuffixes(
  createSetSuffixType('load', scalarType),
  createSetSuffixType('unload', scalarType),
  createSetSuffixType('pack', scalarType),
  createSetSuffixType('unpack', scalarType),
);
