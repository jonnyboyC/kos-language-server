import { createStructureType, createSuffixType, noMap } from '../typeCreators';
import { structureType } from './primitives/structure';
import { situationLoadDistanceType } from './situtationLoadDistance';

export const loadDistanceType = createStructureType('loadDistance');
loadDistanceType.addSuper(noMap(structureType));

loadDistanceType.addSuffixes(
  noMap(createSuffixType('escaping', situationLoadDistanceType)),
  noMap(createSuffixType('flying', situationLoadDistanceType)),
  noMap(createSuffixType('landed', situationLoadDistanceType)),
  noMap(createSuffixType('orbit', situationLoadDistanceType)),
  noMap(createSuffixType('prelaunch', situationLoadDistanceType)),
  noMap(createSuffixType('splashed', situationLoadDistanceType)),
  noMap(createSuffixType('suborbital', situationLoadDistanceType)),
);
