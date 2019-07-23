import { ArgumentType } from './types';
import { createStructureType, createSuffixType } from '../typeCreators';
import { addPrototype, addSuffixes } from '../typeUtilities';
import { scalarType } from './primitives/scalar';
import { structureType } from './primitives/structure';
import { stringType } from './primitives/string';
import { booleanType } from './primitives/boolean';
import { partType } from './parts/part';

export const crewType: ArgumentType = createStructureType('crew');
addPrototype(crewType, structureType);

addSuffixes(
  crewType,
  createSuffixType('name', stringType),
  createSuffixType('tourist', booleanType),
  createSuffixType('gender', stringType),
  createSuffixType('trait', stringType),
  createSuffixType('experience', scalarType),
  createSuffixType('part', partType),
);
