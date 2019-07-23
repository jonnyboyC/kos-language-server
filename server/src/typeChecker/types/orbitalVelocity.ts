import { ArgumentType } from './types';
import { createStructureType, createSuffixType } from '../typeCreators';
import { addPrototype, addSuffixes } from '../typeUtilities';
import { structureType } from './primitives/structure';
import { vectorType } from './collections/vector';

export const orbitableVelocityType: ArgumentType = createStructureType(
  'orbitableVelocity',
);
addPrototype(orbitableVelocityType, structureType);

addSuffixes(
  orbitableVelocityType,
  createSuffixType('obt', vectorType),
  createSuffixType('orbit', vectorType),
  createSuffixType('surface', vectorType),
);
