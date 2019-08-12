import { createStructureType, createSuffixType, noMap } from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { vectorType } from '../collections/vector';
import { scalarType } from '../primitives/scalar';

export const vesselSensorsType = createStructureType('vesselSensors');
vesselSensorsType.addSuper(noMap(structureType));

vesselSensorsType.addSuffixes(
  noMap(createSuffixType('acc', vectorType)),
  noMap(createSuffixType('pres', scalarType)),
  noMap(createSuffixType('temp', scalarType)),
  noMap(createSuffixType('grav', vectorType)),
  noMap(createSuffixType('light', scalarType)),
);
