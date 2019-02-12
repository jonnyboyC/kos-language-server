import { IArgumentType } from './types';
import { createStructureType, createArgSuffixType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './primitives/structure';
import { booleanType, stringType, scalarType } from './primitives/primitives';

export const bodyAtmosphereType: IArgumentType = createStructureType('bodyAtmosphere');
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
