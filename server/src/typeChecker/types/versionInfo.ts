import { ArgumentType } from './types';
import { createStructureType, createSuffixType } from '../typeCreators';
import { addPrototype, addSuffixes } from '../typeUtilities';
import { structureType } from './primitives/structure';
import { scalarType } from './primitives/scalar';

export const versionInfoType: ArgumentType = createStructureType('versioninfo');
addPrototype(versionInfoType, structureType);

addSuffixes(
  versionInfoType,
  createSuffixType('major', scalarType),
  createSuffixType('minor', scalarType),
  createSuffixType('patch', scalarType),
  createSuffixType('build', scalarType),
);
