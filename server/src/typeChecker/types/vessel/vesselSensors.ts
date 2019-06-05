import { ArgumentType } from '../types';
import { createStructureType, createSuffixType } from '../../typeCreators';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { structureType } from '../primitives/structure';
import { vectorType } from '../collections/vector';
import { scalarType } from '../primitives/scalar';

export const vesselSensorsType: ArgumentType = createStructureType(
  'vesselSensors',
);
addPrototype(vesselSensorsType, structureType);

addSuffixes(
  vesselSensorsType,
  createSuffixType('acc', vectorType),
  createSuffixType('pres', scalarType),
  createSuffixType('temp', scalarType),
  createSuffixType('grav', vectorType),
  createSuffixType('light', scalarType),
);
