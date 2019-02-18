import { IArgumentType } from './types';
import { createStructureType, createSuffixType, createArgSuffixType } from './ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { serializableStructureType } from './primitives/structure';
import { vectorType } from './collections/vector';
import { bodyTargetType } from './orbital/bodyTarget';
import { orbitableVelocityType } from './orbitalVelocity';
import { scalarType } from './primitives/scalar';

export const geoCoordinatesType: IArgumentType = createStructureType('geoCoordinates');
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
