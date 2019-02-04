import { IArgumentType } from '../types';
import { createStructureType, createSuffixType, createArgSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { serializableStructureType } from '../structure';
import { stringType, scalarType, booleanType } from '../primitives';
import { directionType } from '../direction';
import { vectorType } from '../collections/vector';
import { geoCoordinatesType } from '../geoCoordinates';
import { userListType } from '../collections/list';
import { bodyTargetType } from './bodyTarget';
import { orbitInfoType } from '../orbitInfo';
import { orbitableVelocityType } from '../orbitalVelocity';

export const orbitableType: IArgumentType = createStructureType('orbitable');
addPrototype(orbitableType, serializableStructureType);

addSuffixes(
  orbitableType,
  createSuffixType('name', stringType),
  createSuffixType('apoapsis', scalarType),
  createSuffixType('periapsis', scalarType),
  createSuffixType('body', bodyTargetType),
  createArgSuffixType('hasBody', booleanType),
  createArgSuffixType('hasObt', booleanType),
  createArgSuffixType('hasOrbit', booleanType),
  createSuffixType('up', directionType),
  createSuffixType('north', directionType),
  createSuffixType('prograde', directionType),
  createSuffixType('retrograde', directionType),
  createSuffixType('srfPrograde', directionType),
  createSuffixType('srfRetrograde', directionType),
  createSuffixType('obt', orbitInfoType),
  createSuffixType('orbit', orbitInfoType),
  createSuffixType('position', vectorType),
  createSuffixType('velocity', orbitableVelocityType),
  createSuffixType('distance', scalarType),
  createSuffixType('direction', directionType),
  createSuffixType('latitude', scalarType),
  createSuffixType('longitude', scalarType),
  createSuffixType('altitude', scalarType),
  createSuffixType('geoPosition', geoCoordinatesType),
  createSuffixType('patches', userListType),
);
