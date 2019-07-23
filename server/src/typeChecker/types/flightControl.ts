import { ArgumentType } from './types';
import {
  createStructureType,
  createSuffixType,
  createSetSuffixType,
} from '../typeCreators';
import { addPrototype, addSuffixes } from '../typeUtilities';
import { structureType } from './primitives/structure';
import { vectorType } from './collections/vector';
import { scalarType } from './primitives/scalar';
import { booleanType } from './primitives/boolean';

export const flightControlType: ArgumentType = createStructureType(
  'flightControl',
);
addPrototype(flightControlType, structureType);

addSuffixes(
  flightControlType,
  createSetSuffixType('yaw', scalarType),
  createSetSuffixType('yawTrim', scalarType),
  createSetSuffixType('roll', scalarType),
  createSetSuffixType('rollTrim', scalarType),
  createSetSuffixType('pitch', scalarType),
  createSetSuffixType('pitchTrim', scalarType),
  createSetSuffixType('rotation', vectorType),
  createSetSuffixType('fore', scalarType),
  createSetSuffixType('starboard', scalarType),
  createSetSuffixType('top', scalarType),
  createSetSuffixType('translation', vectorType),
  createSetSuffixType('wheelSteer', scalarType),
  createSetSuffixType('wheelSteerTrim', scalarType),
  createSetSuffixType('mainThrottle', scalarType),
  createSetSuffixType('wheelThrottle', scalarType),
  createSetSuffixType('wheelThrottleTrim', scalarType),
  createSetSuffixType('bound', booleanType),
  createSuffixType('neutral', booleanType),
  createSuffixType('pilotyaw', scalarType),
  createSuffixType('pilotYawTrim', scalarType),
  createSuffixType('pilotRoll', scalarType),
  createSuffixType('pliotRollTrim', scalarType),
  createSuffixType('pilotPitch', scalarType),
  createSuffixType('pilotPitchTrim', scalarType),
  createSuffixType('pilotFore', scalarType),
  createSuffixType('pilotStarboard', scalarType),
  createSuffixType('pilotTop', scalarType),
  createSuffixType('pilotWheelThrottle', scalarType),
  createSuffixType('pilotWheelThrottleTrim', scalarType),
  createSuffixType('pilotWheelSteer', scalarType),
  createSuffixType('pilotWheelSteerTrim', scalarType),
  createSuffixType('pilotNeutral', booleanType),
  createSuffixType('pilotRotation', vectorType),
  createSuffixType('pilotTranslation', vectorType),
  createSetSuffixType('pilotMainThrottle', scalarType),
);
