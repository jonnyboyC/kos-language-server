import { createStructureType, createSuffixType } from '../typeCreators';
import { structureType } from './primitives/structure';
import { scalarType } from './primitives/scalar';

export const versionInfoType = createStructureType('versioninfo');
versionInfoType.addSuper(structureType);

versionInfoType.addSuffixes(
  createSuffixType('major', scalarType),
  createSuffixType('minor', scalarType),
  createSuffixType('patch', scalarType),
  createSuffixType('build', scalarType),
);
