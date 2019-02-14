import { IArgumentType } from './types';
import {
  createStructureType, createArgSuffixType,
  createSetSuffixType, createSuffixType,
} from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './primitives/structure';
import { pidLoopType } from './pidLoop';
import { directionType } from './direction';
import { voidType } from './primitives/void';
import { booleanType } from './primitives/boolean';
import { scalarType } from './primitives/scalar';

export const steeringManagerType: IArgumentType = createStructureType('steeringManager');
addPrototype(steeringManagerType, structureType);

addSuffixes(
  steeringManagerType,
  createSuffixType('pitchPid', pidLoopType),
  createSuffixType('yawPid', pidLoopType),
  createSuffixType('rollPid', pidLoopType),
  createSuffixType('enabled', booleanType),
  createSuffixType('target', directionType),
  createArgSuffixType('resetPids', voidType),
  createArgSuffixType('resetToDefault', voidType),
  createSetSuffixType('showFacingVectors', booleanType),
  createSetSuffixType('showAngularVectors', booleanType),
  createSetSuffixType('showSteeringStats', booleanType),
  createSetSuffixType('writeCsvFiles', booleanType),
  createSetSuffixType('pitchTs', scalarType),
  createSetSuffixType('yawTs', scalarType),
  createSetSuffixType('rollTs', scalarType),
  createSetSuffixType('maxStoppingTime', scalarType),
  createSuffixType('angleError', scalarType),
  createSuffixType('pitchError', scalarType),
  createSuffixType('yawError', scalarType),
  createSuffixType('rollError', scalarType),
  createSetSuffixType('pitchTorqueAdjust', scalarType),
  createSetSuffixType('yawTorqueAdjust', scalarType),
  createSetSuffixType('rollTorqueAdjust', scalarType),
  createSetSuffixType('pitchTorqueFactor', scalarType),
  createSetSuffixType('yawTorqueFactor', scalarType),
  createSetSuffixType('rollTorqueFactor', scalarType),
  createSuffixType('averageDurction', scalarType),
  createSetSuffixType('rollControlAngleRange', scalarType),
);
