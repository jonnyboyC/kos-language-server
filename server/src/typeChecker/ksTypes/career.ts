import { createType, createSuffixType, noMap } from '../typeCreators';
import { structureType } from './primitives/structure';
import { booleanType } from './primitives/boolean';
import { scalarType } from './primitives/scalar';

export const careerType = createType('career');
careerType.addSuper(noMap(structureType));

careerType.addSuffixes(
  noMap(createSuffixType('canTrackObjects', booleanType)),
  noMap(createSuffixType('patchLimit', scalarType)),
  noMap(createSuffixType('canMakeNodes', booleanType)),
  noMap(createSuffixType('canDoActions', booleanType)),
);
