import { ArgumentType } from './types';
import { createStructureType, createSetSuffixType } from "../typeCreators";
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from './primitives/structure';
import { scalarType } from './primitives/scalar';

export const situationLoadDistanceType: ArgumentType
  = createStructureType('situationLoadDistance');
addPrototype(situationLoadDistanceType, structureType);

addSuffixes(
  situationLoadDistanceType,
  createSetSuffixType('load', scalarType),
  createSetSuffixType('unload', scalarType),
  createSetSuffixType('pack', scalarType),
  createSetSuffixType('unpack', scalarType),
);
