import { createType, createSetSuffixType, noMap } from '../utilities/typeCreators';
import { structureType } from './primitives/structure';
import { scalarType } from './primitives/scalar';

export const situationLoadDistanceType = createType(
  'situationLoadDistance',
);
situationLoadDistanceType.addSuper(noMap(structureType));

situationLoadDistanceType.addSuffixes(
  noMap(createSetSuffixType('load', scalarType)),
  noMap(createSetSuffixType('unload', scalarType)),
  noMap(createSetSuffixType('pack', scalarType)),
  noMap(createSetSuffixType('unpack', scalarType)),
);
