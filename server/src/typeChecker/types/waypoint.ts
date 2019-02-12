import { IArgumentType } from './types';
import { createStructureType, createArgSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './primitives/structure';
import { scalarType, stringType, booleanType } from './primitives/primitives';
import { bodyTargetType } from './orbital/bodyTarget';
import { geoCoordinatesType } from './geoCoordinates';
import { vectorType } from './collections/vector';

export const waypointType: IArgumentType = createStructureType('waypoint');
addPrototype(waypointType, structureType);

addSuffixes(
  waypointType,
  createArgSuffixType('dump', stringType),
  createArgSuffixType('name', stringType),
  createArgSuffixType('body', bodyTargetType),
  createArgSuffixType('geoPosition', geoCoordinatesType),
  createArgSuffixType('position', vectorType),
  createArgSuffixType('altitude', scalarType),
  createArgSuffixType('agl', scalarType),
  createArgSuffixType('nearSurface', booleanType),
  createArgSuffixType('grounded', booleanType),
  createArgSuffixType('index', scalarType),
  createArgSuffixType('clustered', booleanType),
);
