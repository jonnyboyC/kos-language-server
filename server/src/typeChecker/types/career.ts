import { IArgumentType } from './types';
import { createStructureType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './primitives/structure';
import { booleanType, scalarType } from './primitives/primitives';

export const careerType: IArgumentType = createStructureType('career');
addPrototype(careerType, structureType);

addSuffixes(
  careerType,
  createSuffixType('canTrackObjects', booleanType),
  createSuffixType('patchLimit', scalarType),
  createSuffixType('canMakeNodes', booleanType),
  createSuffixType('canDoActions', booleanType),
);
