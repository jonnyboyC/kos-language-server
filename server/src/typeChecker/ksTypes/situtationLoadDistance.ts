import { createStructureType, createSetSuffixType, noMap } from '../typeCreators';
import { structureType } from './primitives/structure';
import { scalarType } from './primitives/scalar';

export const situationLoadDistanceType = createStructureType(
  'situationLoadDistance',
);
situationLoadDistanceType.addSuper(noMap(structureType));

situationLoadDistanceType.addSuffixes(
  noMap(createSetSuffixType('load', scalarType)),
  noMap(createSetSuffixType('unload', scalarType)),
  noMap(createSetSuffixType('pack', scalarType)),
  noMap(createSetSuffixType('unpack', scalarType)),
);
