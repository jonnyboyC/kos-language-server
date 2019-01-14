import { IType } from './types';
import { createStructureType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { scalarType } from './primitives';
import { vectorType } from './collections/vector';

export const directionType: IType = createStructureType('direction');
addPrototype(directionType, structureType);

addSuffixes(
  directionType,
  createSuffixType('pitch', scalarType),
  createSuffixType('yaw', scalarType),
  createSuffixType('roll', scalarType),
  createSuffixType('forVector', vectorType),
  createSuffixType('vector', vectorType),
  createSuffixType('topVector', vectorType),
  createSuffixType('upVector', vectorType),
  createSuffixType('starVector', vectorType),
  createSuffixType('rightVector', vectorType),
  createSuffixType('inverse', directionType),
);
