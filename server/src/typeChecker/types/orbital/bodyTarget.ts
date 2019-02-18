import { IArgumentType } from '../types';
import { createStructureType, createArgSuffixType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { structureType } from '../primitives/structure';
import { orbitableType } from './orbitable';
import { vectorType } from '../collections/vector';
import { geoCoordinatesType } from '../geoCoordinates';
import { userListType } from '../collections/userList';
import { bodyAtmosphereType } from '../bodyatmosphere';
import { stringType } from '../primitives/string';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';

export const bodyTargetType: IArgumentType = createStructureType('bodyTarget');
addPrototype(bodyTargetType, orbitableType);

addSuffixes(
  bodyTargetType,
  createSuffixType('name', structureType),
  createSuffixType('description', stringType),
  createSuffixType('mass', scalarType),
  createSuffixType('hasOcean', booleanType),
  createSuffixType('hasSolidSurface', booleanType),
  createSuffixType('orbitingChildren', userListType),
  createSuffixType('altitude', scalarType),
  createSuffixType('radius', scalarType),
  createSuffixType('mu', scalarType),
  createSuffixType('rotationPeriod', scalarType),
  createSuffixType('atm', bodyAtmosphereType),
  createSuffixType('angularVel', vectorType),
  createSuffixType('soiRadius', scalarType),
  createSuffixType('rotationAngle', scalarType),
  createArgSuffixType('geoPositionOf', geoCoordinatesType, vectorType),
  createArgSuffixType('altitudeOf', scalarType, vectorType),
  createArgSuffixType('geoPositionLatLng', geoCoordinatesType, scalarType, scalarType),
);
