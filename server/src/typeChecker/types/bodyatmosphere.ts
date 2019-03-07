import { IArgumentType } from './types';
import { createStructureType, createArgSuffixType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from './primitives/structure';
import { stringType } from './primitives/string';
import { booleanType } from './primitives/boolean';
import { scalarType } from './primitives/scalar';

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
