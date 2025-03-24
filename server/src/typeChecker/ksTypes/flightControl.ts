import {
  createType,
  createSuffixType,
  createSetSuffixType,
  noMap,
  createSetOnlySuffixType,
} from '../utilities/typeCreators';
import { structureType } from './primitives/structure';
import { vectorType } from './collections/vector';
import { scalarType } from './primitives/scalar';
import { booleanType } from './primitives/boolean';

export const flightControlType = createType('flightControl');
flightControlType.addSuper(noMap(structureType));

flightControlType.addSuffixes(
  noMap(createSetSuffixType('yaw', scalarType)),
  noMap(createSetSuffixType('yawTrim', scalarType)),
  noMap(createSetSuffixType('roll', scalarType)),
  noMap(createSetSuffixType('rollTrim', scalarType)),
  noMap(createSetSuffixType('pitch', scalarType)),
  noMap(createSetSuffixType('pitchTrim', scalarType)),
  noMap(createSetSuffixType('rotation', vectorType)),
  noMap(createSetOnlySuffixType('killRotation', booleanType)),
  noMap(createSetSuffixType('fore', scalarType)),
  noMap(createSetSuffixType('starboard', scalarType)),
  noMap(createSetSuffixType('top', scalarType)),
  noMap(createSetSuffixType('translation', vectorType)),
  noMap(createSetSuffixType('wheelSteer', scalarType)),
  noMap(createSetSuffixType('wheelSteerTrim', scalarType)),
  noMap(createSetSuffixType('mainThrottle', scalarType)),
  noMap(createSetSuffixType('wheelThrottle', scalarType)),
  noMap(createSetSuffixType('wheelThrottleTrim', scalarType)),
  noMap(createSetSuffixType('bound', booleanType)),
  noMap(createSetOnlySuffixType('resetTrim', booleanType)),
  noMap(createSetSuffixType('neutral', booleanType)),
  noMap(createSetSuffixType('neutralize', booleanType)),
  noMap(createSuffixType('pilotyaw', scalarType)),
  noMap(createSetSuffixType('pilotYawTrim', scalarType)),
  noMap(createSuffixType('pilotRoll', scalarType)),
  noMap(createSetSuffixType('pliotRollTrim', scalarType)),
  noMap(createSuffixType('pilotPitch', scalarType)),
  noMap(createSetSuffixType('pilotPitchTrim', scalarType)),
  noMap(createSuffixType('pilotFore', scalarType)),
  noMap(createSuffixType('pilotStarboard', scalarType)),
  noMap(createSuffixType('pilotTop', scalarType)),
  noMap(createSetSuffixType('pilotWheelThrottle', scalarType)),
  noMap(createSetSuffixType('pilotWheelThrottleTrim', scalarType)),
  noMap(createSuffixType('pilotWheelSteer', scalarType)),
  noMap(createSetSuffixType('pilotWheelSteerTrim', scalarType)),
  noMap(createSuffixType('pilotNeutral', booleanType)),
  noMap(createSuffixType('pilotRotation', vectorType)),
  noMap(createSuffixType('pilotTranslation', vectorType)),
  noMap(createSetSuffixType('pilotMainThrottle', scalarType)),
);
