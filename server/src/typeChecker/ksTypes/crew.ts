import { createStructureType, createSuffixType, noMap } from '../typeCreators';
import { scalarType } from './primitives/scalar';
import { structureType } from './primitives/structure';
import { stringType } from './primitives/string';
import { booleanType } from './primitives/boolean';
import { partType } from './parts/part';

export const crewType = createStructureType('crew');
crewType.addSuper(noMap(structureType));

crewType.addSuffixes(
  noMap(createSuffixType('name', stringType)),
  noMap(createSuffixType('tourist', booleanType)),
  noMap(createSuffixType('gender', stringType)),
  noMap(createSuffixType('trait', stringType)),
  noMap(createSuffixType('experience', scalarType)),
  noMap(createSuffixType('part', partType)),
);
