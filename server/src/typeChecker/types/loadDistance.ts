import { createStructureType, createSuffixType } from '../typeCreators';
import { structureType } from './primitives/structure';
import { situationLoadDistanceType } from './situtationLoadDistance';

export const loadDistanceType = createStructureType('loadDistance');
loadDistanceType.addSuper(structureType);

loadDistanceType.addSuffixes(
  createSuffixType('escaping', situationLoadDistanceType),
  createSuffixType('flying', situationLoadDistanceType),
  createSuffixType('landed', situationLoadDistanceType),
  createSuffixType('orbit', situationLoadDistanceType),
  createSuffixType('prelaunch', situationLoadDistanceType),
  createSuffixType('splashed', situationLoadDistanceType),
  createSuffixType('suborbital', situationLoadDistanceType),
);
