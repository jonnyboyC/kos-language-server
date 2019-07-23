import { ArgumentType } from './types';
import { createStructureType, createSuffixType } from '../typeCreators';
import { addPrototype, addSuffixes } from '../typeUtilities';
import { structureType } from './primitives/structure';
import { situationLoadDistanceType } from './situtationLoadDistance';

export const loadDistanceType: ArgumentType = createStructureType(
  'loadDistance',
);
addPrototype(loadDistanceType, structureType);

addSuffixes(
  loadDistanceType,
  createSuffixType('escaping', situationLoadDistanceType),
  createSuffixType('flying', situationLoadDistanceType),
  createSuffixType('landed', situationLoadDistanceType),
  createSuffixType('orbit', situationLoadDistanceType),
  createSuffixType('prelaunch', situationLoadDistanceType),
  createSuffixType('splashed', situationLoadDistanceType),
  createSuffixType('suborbital', situationLoadDistanceType),
);
