import { IType } from './types';
import { createStructureType, createArgSuffixType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { booleanType, stringType, scalarType } from './primitives';
import { orbitableType } from './orbitable';
import { listType } from './collections/list';
import { vectorType } from './collections/vector';
import { geoCoordinatesType } from './geoCoordinates';

export const bodyTargetType: IType = createStructureType('bodyTarget');
addPrototype(bodyTargetType, orbitableType);

addSuffixes(
  bodyTargetType,
  createSuffixType('name', structureType),
  createSuffixType('description', stringType),
  createSuffixType('mass', scalarType),
  createSuffixType('hasOcean', booleanType),
  createSuffixType('hasSolidSurface', booleanType),
  createSuffixType('orbitingChildren', listType.toConcreteType(structureType)),
  createSuffixType('altitude', scalarType),
  createSuffixType('radius', scalarType),
  createSuffixType('mu', scalarType),
  createSuffixType('rotationPeriod', scalarType),
  createSuffixType('atm', /* TODO */ scalarType),
  createSuffixType('angularVel', vectorType),
  createSuffixType('soiRadius', scalarType),
  createSuffixType('rotationAngle', scalarType),
  createArgSuffixType('geoPositionOf', geoCoordinatesType, vectorType),
  createArgSuffixType('altitudeOf', scalarType, vectorType),
  createArgSuffixType('geoPositionLatLng', geoCoordinatesType, scalarType, scalarType),
);
