import { ArgumentType } from './types';
import { createStructureType, createSuffixType, createArgSuffixType } from "../typeCreators";
import { addPrototype, addSuffixes } from '../typeUitlities';
import { vectorType } from './collections/vector';
import { orbitableVelocityType } from './orbitalVelocity';
import { scalarType } from './primitives/scalar';
import { serializableStructureType } from './primitives/serializeableStructure';
import { bodyTargetType } from './orbital/bodyTarget';

export const geoCoordinatesType: ArgumentType = createStructureType('geoCoordinates');
addPrototype(geoCoordinatesType, serializableStructureType);

addSuffixes(
  geoCoordinatesType,
  createSuffixType('lat', scalarType),
  createSuffixType('lng', scalarType),
  createSuffixType('body', bodyTargetType),
  createSuffixType('terrainHeight', scalarType),
  createSuffixType('distance', scalarType),
  createSuffixType('heading', scalarType),
  createSuffixType('bearing', scalarType),
  createSuffixType('position', vectorType),
  createSuffixType('velocity', orbitableVelocityType),
  createArgSuffixType('altitudePosition', vectorType, scalarType),
  createArgSuffixType('altitudeVelocity', orbitableVelocityType, scalarType),
);
