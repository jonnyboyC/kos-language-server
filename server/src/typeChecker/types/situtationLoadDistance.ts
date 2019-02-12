import { IArgumentType } from './types';
import { createStructureType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { scalarType } from './primitives';

export const situationLoadDistanceType: IArgumentType
  = createStructureType('situationLoadDistance');
addPrototype(situationLoadDistanceType, structureType);

addSuffixes(
  situationLoadDistanceType,
  createSetSuffixType('load', scalarType),
  createSetSuffixType('unload', scalarType),
  createSetSuffixType('pack', scalarType),
  createSetSuffixType('unpack', scalarType),
);
