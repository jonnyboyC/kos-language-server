import { IType } from './types';
import { createStructureType, createArgSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { scalarType, stringType, booleanType } from './primitives';
import { bodyTargetType } from './orbital/bodyTarget';
import { geoCoordinatesType } from './geoCoordinates';
import { vectorType } from './collections/vector';

export const waypointType: IType = createStructureType('waypoint');
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
