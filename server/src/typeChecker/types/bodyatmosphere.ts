import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
} from '../typeCreators';
import { structureType } from './primitives/structure';
import { stringType } from './primitives/string';
import { booleanType } from './primitives/boolean';
import { scalarType } from './primitives/scalar';

export const bodyAtmosphereType = createStructureType('bodyAtmosphere');
bodyAtmosphereType.addSuper(structureType);

bodyAtmosphereType.addSuffixes(
  createSuffixType('body', stringType),
  createSuffixType('exists', booleanType),
  createSuffixType('oxygen', booleanType),
  createSuffixType('seaLevelPressure', scalarType),
  createSuffixType('height', scalarType),
  createArgSuffixType('altitudePressure', scalarType, scalarType),
  createSuffixType('molarMass', scalarType),
  createSuffixType('adiabaticIndex', scalarType),
  createSuffixType('adbIdx', scalarType),
  createArgSuffixType('altitudeTemperature', scalarType, scalarType),
  createArgSuffixType('altTemp', scalarType, scalarType),
);
