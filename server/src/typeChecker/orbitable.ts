import { IType } from './types';
import { createStructureType, createSuffixType, createArgSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { serializableStructureType, structureType } from './structure';
import { stringType, scalarType, booleanType } from './primitives';
import { directionType } from './direction';
import { vectorType } from './collections/vector';
import { geoCoordinatesType } from './geoCoordinates';
import { listType } from './collections/list';

export const orbitableType: IType = createStructureType('orbitable');
addPrototype(orbitableType, serializableStructureType);

addSuffixes(
  orbitableType,
  createSuffixType('name', stringType),
  createSuffixType('apoapsis', scalarType),
  createSuffixType('periapsis', scalarType),
  createSuffixType('body', /* TODO */ scalarType),
  createArgSuffixType('hasBody', booleanType),
  createArgSuffixType('hasObt', booleanType),
  createArgSuffixType('hasOrbit', booleanType),
  createSuffixType('up', directionType),
  createSuffixType('north', directionType),
  createSuffixType('prograde', directionType),
  createSuffixType('retrograde', directionType),
  createSuffixType('srfPrograde', directionType),
  createSuffixType('srfRetrograde', directionType),
  createSuffixType('obt', /* TODO */ scalarType),
  createSuffixType('orbit',  /* TODO */ scalarType),
  createSuffixType('position', vectorType),
  createSuffixType('velocity', /* TODO */ scalarType),
  createSuffixType('distance', scalarType),
  createSuffixType('direction', directionType),
  createSuffixType('latitude', scalarType),
  createSuffixType('longitude', scalarType),
  createSuffixType('altitude', scalarType),
  createSuffixType('geoPosition', geoCoordinatesType),
  createSuffixType('patches', listType.toConcreteType(structureType)),
);
