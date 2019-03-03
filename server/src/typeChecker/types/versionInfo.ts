import { IArgumentType } from './types';
import { createStructureType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from './primitives/structure';
import { scalarType } from './primitives/scalar';

export const versionInfoType: IArgumentType = createStructureType('versioninfo');
addPrototype(versionInfoType, structureType);

addSuffixes(
  versionInfoType,
  createSuffixType('major', scalarType),
  createSuffixType('minor', scalarType),
  createSuffixType('patch', scalarType),
  createSuffixType('build', scalarType),
);