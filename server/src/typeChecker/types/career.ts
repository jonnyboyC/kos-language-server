import { ArgumentType } from './types';
import { createStructureType, createSuffixType } from '../typeCreators';
import { addPrototype, addSuffixes } from '../typeUtilities';
import { structureType } from './primitives/structure';
import { booleanType } from './primitives/boolean';
import { scalarType } from './primitives/scalar';

export const careerType: ArgumentType = createStructureType('career');
addPrototype(careerType, structureType);

addSuffixes(
  careerType,
  createSuffixType('canTrackObjects', booleanType),
  createSuffixType('patchLimit', scalarType),
  createSuffixType('canMakeNodes', booleanType),
  createSuffixType('canDoActions', booleanType),
);
