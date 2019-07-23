import { ArgumentType } from './types';
import { createStructureType, createArgSuffixType } from "../typeCreators";
import { addPrototype, addSuffixes } from '../typeUtilities';
import { structureType } from './primitives/structure';
import { vectorType } from './collections/vector';
import { stringType } from './primitives/string';
import { scalarType } from './primitives/scalar';
import { booleanType } from './primitives/boolean';
import { geoCoordinatesType } from './geoCoordinates';
import { bodyTargetType } from './orbital/bodyTarget';

export const waypointType: ArgumentType = createStructureType('waypoint');
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
