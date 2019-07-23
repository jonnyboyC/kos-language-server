import { ArgumentType } from '../types';
import { createStructureType, createSuffixType, createSetSuffixType } from '../../typeCreators';
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { booleanType } from '../primitives/boolean';
import { partModuleType } from './partModule';
import { scalarType } from '../primitives/scalar';

export const gimbalType: ArgumentType = createStructureType('gimbal');
addPrototype(gimbalType, partModuleType);

addSuffixes(
  gimbalType,
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
