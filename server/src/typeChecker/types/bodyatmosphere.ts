import { IType } from './types';
import { createStructureType, createArgSuffixType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { booleanType, stringType, scalarType } from './primitives';

export const bodyAtmosphereType: IType = createStructureType('bodyAtmosphere');
addPrototype(bodyAtmosphereType, structureType);

addSuffixes(
  bodyAtmosphereType,
  createSuffixType('body', stringType),
  createSuffixType('exists', booleanType),
  createSuffixType('oxygen', booleanType),
  createSuffixType('seaLevelPressure', scalarType),
  createSuffixType('height', scalarType),
  createArgSuffixType('altitudePressure', scalarType, scalarType),
  createSuffixType('scale', scalarType),
);
