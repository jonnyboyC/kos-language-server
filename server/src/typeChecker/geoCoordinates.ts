import { IType } from './types';
import { createStructureType, createSuffixType, createArgSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { serializableStructureType } from './structure';
import { scalarType } from './primitives';
import { vectorType } from './collections/vector';

export const geoCoordinatesType: IType = createStructureType('geoCoordinates');
addPrototype(geoCoordinatesType, serializableStructureType);

addSuffixes(
  geoCoordinatesType,
  createSuffixType('lat', scalarType),
  createSuffixType('lng', scalarType),
  createSuffixType('body', /* TODO */ scalarType),
  createSuffixType('terrainHeight', scalarType),
  createSuffixType('distance', scalarType),
  createSuffixType('heading', scalarType),
  createSuffixType('bearing', scalarType),
  createSuffixType('position', vectorType),
  createSuffixType('velocity', /* TODO */ vectorType),
  createArgSuffixType('altitudePosition', vectorType, scalarType),
  createArgSuffixType('altitudeVelocity', /* TODO */ vectorType, scalarType),
);
