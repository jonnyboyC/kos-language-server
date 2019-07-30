import { createStructureType, createSuffixType } from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { vectorType } from '../collections/vector';
import { scalarType } from '../primitives/scalar';

export const vesselSensorsType = createStructureType('vesselSensors');
vesselSensorsType.addSuper(structureType);

vesselSensorsType.addSuffixes(
  createSuffixType('acc', vectorType),
  createSuffixType('pres', scalarType),
  createSuffixType('temp', scalarType),
  createSuffixType('grav', vectorType),
  createSuffixType('light', scalarType),
);
