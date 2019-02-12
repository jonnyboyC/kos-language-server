import { IArgumentType } from './types';
import { createStructureType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './primitives/structure';
import { situationLoadDistanceType } from './situtationLoadDistance';

export const loadDistanceType: IArgumentType = createStructureType('loadDistance');
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
