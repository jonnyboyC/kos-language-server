import { ArgumentType } from './types';
import { createStructureType, createSuffixType, createSetSuffixType } from "../typeCreators";
import { addPrototype, addSuffixes } from '../typeUtilities';
import { structureType } from './primitives/structure';
import { vectorType } from './collections/vector';
import { orbitInfoType } from './orbitInfo';
import { scalarType } from './primitives/scalar';

export const nodeType: ArgumentType = createStructureType('node');
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
