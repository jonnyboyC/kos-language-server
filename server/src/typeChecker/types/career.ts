import { createStructureType, createSuffixType } from '../typeCreators';
import { structureType } from './primitives/structure';
import { booleanType } from './primitives/boolean';
import { scalarType } from './primitives/scalar';

export const careerType = createStructureType('career');
careerType.addSuper(structureType);

careerType.addSuffixes(
  createSuffixType('canTrackObjects', booleanType),
  createSuffixType('patchLimit', scalarType),
  createSuffixType('canMakeNodes', booleanType),
  createSuffixType('canDoActions', booleanType),
);
