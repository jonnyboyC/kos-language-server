import {
  createStructureType,
  createSuffixType,
  createSetSuffixType,
  noMap,
} from '../../typeCreators';
import { booleanType } from '../primitives/boolean';
import { partModuleType } from './partModule';
import { scalarType } from '../primitives/scalar';

export const gimbalType = createStructureType('gimbal');
gimbalType.addSuper(noMap(partModuleType));

gimbalType.addSuffixes(
  noMap(createSetSuffixType('lock', booleanType)),
  noMap(createSetSuffixType('pitch', booleanType)),
  noMap(createSetSuffixType('yaw', booleanType)),
  noMap(createSetSuffixType('roll', booleanType)),
  noMap(createSetSuffixType('limit', scalarType)),
  noMap(createSuffixType('range', scalarType)),
  noMap(createSuffixType('responseSpeed', scalarType)),
  noMap(createSuffixType('pitchAngle', scalarType)),
  noMap(createSuffixType('yawAngle', scalarType)),
  noMap(createSuffixType('rollAngle', scalarType)),
);
