import { createType, createArgSuffixType, noMap } from '../typeCreators';
import { structureType } from './primitives/structure';
import { vectorType } from './collections/vector';
import { stringType } from './primitives/string';
import { scalarType } from './primitives/scalar';
import { booleanType } from './primitives/boolean';
import { geoCoordinatesType } from './geoCoordinates';
import { bodyTargetType } from './orbital/bodyTarget';

export const waypointType = createType('waypoint');
waypointType.addSuper(noMap(structureType));

waypointType.addSuffixes(
  noMap(createArgSuffixType('dump', stringType)),
  noMap(createArgSuffixType('name', stringType)),
  noMap(createArgSuffixType('body', bodyTargetType)),
  noMap(createArgSuffixType('geoPosition', geoCoordinatesType)),
  noMap(createArgSuffixType('position', vectorType)),
  noMap(createArgSuffixType('altitude', scalarType)),
  noMap(createArgSuffixType('agl', scalarType)),
  noMap(createArgSuffixType('nearSurface', booleanType)),
  noMap(createArgSuffixType('grounded', booleanType)),
  noMap(createArgSuffixType('index', scalarType)),
  noMap(createArgSuffixType('clustered', booleanType)),
);
