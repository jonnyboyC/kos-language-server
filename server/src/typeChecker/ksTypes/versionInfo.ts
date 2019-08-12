import { createStructureType, createSuffixType, noMap } from '../typeCreators';
import { structureType } from './primitives/structure';
import { scalarType } from './primitives/scalar';

export const versionInfoType = createStructureType('versioninfo');
versionInfoType.addSuper(noMap(structureType));

versionInfoType.addSuffixes(
  noMap(createSuffixType('major', scalarType)),
  noMap(createSuffixType('minor', scalarType)),
  noMap(createSuffixType('patch', scalarType)),
  noMap(createSuffixType('build', scalarType)),
);
