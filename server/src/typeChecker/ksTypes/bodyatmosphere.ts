import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
  noMap,
} from '../typeCreators';
import { structureType } from './primitives/structure';
import { stringType } from './primitives/string';
import { booleanType } from './primitives/boolean';
import { scalarType } from './primitives/scalar';

export const bodyAtmosphereType = createStructureType('bodyAtmosphere');
bodyAtmosphereType.addSuper(noMap(structureType));

bodyAtmosphereType.addSuffixes(
  noMap(createSuffixType('body', stringType)),
  noMap(createSuffixType('exists', booleanType)),
  noMap(createSuffixType('oxygen', booleanType)),
  noMap(createSuffixType('seaLevelPressure', scalarType)),
  noMap(createSuffixType('height', scalarType)),
  noMap(createArgSuffixType('altitudePressure', scalarType, scalarType)),
  noMap(createSuffixType('molarMass', scalarType)),
  noMap(createSuffixType('adiabaticIndex', scalarType)),
  noMap(createSuffixType('adbIdx', scalarType)),
  noMap(createArgSuffixType('altitudeTemperature', scalarType, scalarType)),
  noMap(createArgSuffixType('altTemp', scalarType, scalarType)),
);
