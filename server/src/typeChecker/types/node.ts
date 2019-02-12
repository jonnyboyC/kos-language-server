import { IArgumentType } from './types';
import { createStructureType, createSuffixType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './primitives/structure';
import { scalarType } from './primitives/primitives';
import { vectorType } from './collections/vector';
import { orbitInfoType } from './orbitInfo';

export const nodeType: IArgumentType = createStructureType('node');
addPrototype(nodeType, structureType);

addSuffixes(
  nodeType,
  createSuffixType('deltaV', vectorType),
  createSuffixType('burnVector', vectorType),
  createSetSuffixType('eta', scalarType),
  createSetSuffixType('prograde', scalarType),
  createSetSuffixType('radialOut', scalarType),
  createSetSuffixType('normal', scalarType),
  createSuffixType('obt', orbitInfoType),
  createSuffixType('orbit', orbitInfoType),
);
