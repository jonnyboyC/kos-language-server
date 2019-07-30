import { createStructureType, createSuffixType } from '../typeCreators';
import { structureType } from './primitives/structure';
import { vectorType } from './collections/vector';

export const orbitableVelocityType = createStructureType('orbitableVelocity');
orbitableVelocityType.addSuper(structureType);

orbitableVelocityType.addSuffixes(
  createSuffixType('obt', vectorType),
  createSuffixType('orbit', vectorType),
  createSuffixType('surface', vectorType),
);
