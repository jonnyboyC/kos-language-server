import {
  createStructureType,
  createSuffixType,
  createSetSuffixType,
} from '../../typeCreators';
import { booleanType } from '../primitives/boolean';
import { partModuleType } from './partModule';
import { scalarType } from '../primitives/scalar';

export const gimbalType = createStructureType('gimbal');
gimbalType.addSuper(partModuleType);

gimbalType.addSuffixes(
  createSetSuffixType('lock', booleanType),
  createSetSuffixType('pitch', booleanType),
  createSetSuffixType('yaw', booleanType),
  createSetSuffixType('roll', booleanType),
  createSetSuffixType('limit', scalarType),
  createSuffixType('range', scalarType),
  createSuffixType('responseSpeed', scalarType),
  createSuffixType('pitchAngle', scalarType),
  createSuffixType('yawAngle', scalarType),
  createSuffixType('rollAngle', scalarType),
);
