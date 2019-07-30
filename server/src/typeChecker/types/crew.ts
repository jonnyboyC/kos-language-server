import { createStructureType, createSuffixType } from '../typeCreators';
import { scalarType } from './primitives/scalar';
import { structureType } from './primitives/structure';
import { stringType } from './primitives/string';
import { booleanType } from './primitives/boolean';
import { partType } from './parts/part';

export const crewType = createStructureType('crew');
crewType.addSuper(structureType);

crewType.addSuffixes(
  createSuffixType('name', stringType),
  createSuffixType('tourist', booleanType),
  createSuffixType('gender', stringType),
  createSuffixType('trait', stringType),
  createSuffixType('experience', scalarType),
  createSuffixType('part', partType),
);
