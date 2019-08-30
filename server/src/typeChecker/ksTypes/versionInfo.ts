import { createType, createSuffixType, noMap } from '../utilities/typeCreators';
import { structureType } from './primitives/structure';
import { scalarType } from './primitives/scalar';

export const versionInfoType = createType('versioninfo');
versionInfoType.addSuper(noMap(structureType));

versionInfoType.addSuffixes(
  noMap(createSuffixType('major', scalarType)),
  noMap(createSuffixType('minor', scalarType)),
  noMap(createSuffixType('patch', scalarType)),
  noMap(createSuffixType('build', scalarType)),
);
