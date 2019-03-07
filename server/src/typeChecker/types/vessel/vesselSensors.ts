import { IArgumentType } from '../types';
import { createStructureType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { structureType } from '../primitives/structure';
import { vectorType } from '../collections/vector';
import { scalarType } from '../primitives/scalar';

export const vesselSensorsType: IArgumentType = createStructureType('vesselSensors');
addPrototype(vesselSensorsType, structureType);

addSuffixes(
  vesselSensorsType,
  createSuffixType('acc', vectorType),
  createSuffixType('pres', scalarType),
  createSuffixType('temp', scalarType),
  createSuffixType('grav', vectorType),
  createSuffixType('light', scalarType),
);
