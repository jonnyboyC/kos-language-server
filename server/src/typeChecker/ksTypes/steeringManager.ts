import {
  createType,
  createArgSuffixType,
  createSetSuffixType,
  createSuffixType,
  noMap,
} from '../utilities/typeCreators';
import { structureType } from './primitives/structure';
import { pidLoopType } from './pidLoop';
import { directionType } from './collections/direction';
import { noneType } from './primitives/none';
import { booleanType } from './primitives/boolean';
import { scalarType } from './primitives/scalar';

export const steeringManagerType = createType('steeringManager');
steeringManagerType.addSuper(noMap(structureType));

steeringManagerType.addSuffixes(
  noMap(createSuffixType('pitchPid', pidLoopType)),
  noMap(createSuffixType('yawPid', pidLoopType)),
  noMap(createSuffixType('rollPid', pidLoopType)),
  noMap(createSuffixType('enabled', booleanType)),
  noMap(createSuffixType('target', directionType)),
  noMap(createArgSuffixType('resetPids', noneType)),
  noMap(createArgSuffixType('resetToDefault', noneType)),
  noMap(createSetSuffixType('showFacingVectors', booleanType)),
  noMap(createSetSuffixType('showAngularVectors', booleanType)),
  noMap(createSetSuffixType('showSteeringStats', booleanType)),
  noMap(createSetSuffixType('writeCsvFiles', booleanType)),
  noMap(createSetSuffixType('pitchTs', scalarType)),
  noMap(createSetSuffixType('yawTs', scalarType)),
  noMap(createSetSuffixType('rollTs', scalarType)),
  noMap(createSetSuffixType('maxStoppingTime', scalarType)),
  noMap(createSuffixType('angleError', scalarType)),
  noMap(createSuffixType('pitchError', scalarType)),
  noMap(createSuffixType('yawError', scalarType)),
  noMap(createSuffixType('rollError', scalarType)),
  noMap(createSetSuffixType('pitchTorqueAdjust', scalarType)),
  noMap(createSetSuffixType('yawTorqueAdjust', scalarType)),
  noMap(createSetSuffixType('rollTorqueAdjust', scalarType)),
  noMap(createSetSuffixType('pitchTorqueFactor', scalarType)),
  noMap(createSetSuffixType('yawTorqueFactor', scalarType)),
  noMap(createSetSuffixType('rollTorqueFactor', scalarType)),
  noMap(createSuffixType('averageDurction', scalarType)),
  noMap(createSetSuffixType('rollControlAngleRange', scalarType)),
  noMap(createSetSuffixType('torqueEpsilonMin', scalarType)),
  noMap(createSetSuffixType('torqueEpsilonMax', scalarType)),

);
