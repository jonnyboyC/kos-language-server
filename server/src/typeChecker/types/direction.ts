import { ArgumentType } from './types';
import { createStructureType, createSuffixType } from '../typeCreators';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { vectorType } from './collections/vector';
import { scalarType } from './primitives/scalar';
import { serializableStructureType } from './primitives/serializeableStructure';

export const directionType: ArgumentType = createStructureType('direction');
addPrototype(directionType, serializableStructureType);

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
