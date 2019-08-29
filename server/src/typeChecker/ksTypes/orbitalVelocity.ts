import { createType, createSuffixType, noMap } from '../utilities/typeCreators';
import { structureType } from './primitives/structure';
import { vectorType } from './collections/vector';

export const orbitableVelocityType = createType('orbitableVelocity');
orbitableVelocityType.addSuper(noMap(structureType));

orbitableVelocityType.addSuffixes(
  noMap(createSuffixType('obt', vectorType)),
  noMap(createSuffixType('orbit', vectorType)),
  noMap(createSuffixType('surface', vectorType)),
);
