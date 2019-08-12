import {
  createStructureType,
  createSuffixType,
  createArgSuffixType,
  noMap,
} from '../typeCreators';
import { vectorType } from './collections/vector';
import { orbitableVelocityType } from './orbitalVelocity';
import { scalarType } from './primitives/scalar';
import { serializableType } from './primitives/serializeableStructure';
import { bodyTargetType } from './orbital/bodyTarget';

export const geoCoordinatesType = createStructureType('geoCoordinates');
geoCoordinatesType.addSuper(noMap(serializableType));

geoCoordinatesType.addSuffixes(
  noMap(createSuffixType('lat', scalarType)),
  noMap(createSuffixType('lng', scalarType)),
  noMap(createSuffixType('body', bodyTargetType)),
  noMap(createSuffixType('terrainHeight', scalarType)),
  noMap(createSuffixType('distance', scalarType)),
  noMap(createSuffixType('heading', scalarType)),
  noMap(createSuffixType('bearing', scalarType)),
  noMap(createSuffixType('position', vectorType)),
  noMap(createSuffixType('velocity', orbitableVelocityType)),
  noMap(createArgSuffixType('altitudePosition', vectorType, scalarType)),
  noMap(
    createArgSuffixType('altitudeVelocity', orbitableVelocityType, scalarType),
  ),
);
