import { IType } from './types';
import { createStructureType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { booleanType, scalarType } from './primitives';

export const careerType: IType = createStructureType('career');
addPrototype(careerType, structureType);

addSuffixes(
  careerType,
  createSuffixType('canTrackObjects', booleanType),
  createSuffixType('patchLimit', scalarType),
  createSuffixType('canMakeNodes', booleanType),
  createSuffixType('canDoActions', booleanType),
);
