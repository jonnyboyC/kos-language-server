import {
  createStructureType,
  createSuffixType,
  createSetSuffixType,
  noMap,
} from '../typeCreators';
import { structureType } from './primitives/structure';
import { vectorType } from './collections/vector';
import { orbitInfoType } from './orbitInfo';
import { scalarType } from './primitives/scalar';

export const nodeType = createStructureType('node');
nodeType.addSuper(noMap(structureType));

nodeType.addSuffixes(
  noMap(createSuffixType('deltaV', vectorType)),
  noMap(createSuffixType('burnVector', vectorType)),
  noMap(createSetSuffixType('eta', scalarType)),
  noMap(createSetSuffixType('prograde', scalarType)),
  noMap(createSetSuffixType('radialOut', scalarType)),
  noMap(createSetSuffixType('normal', scalarType)),
  noMap(createSuffixType('obt', orbitInfoType)),
  noMap(createSuffixType('orbit', orbitInfoType)),
);
