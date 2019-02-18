import { IArgumentType } from './types';
import {
  createStructureType, createArgSuffixType,
  createSuffixType, createSetSuffixType,
} from './ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from './primitives/structure';
import { voidType } from './primitives/void';
import { scalarType } from './primitives/scalar';

export const pidLoopType: IArgumentType = createStructureType('pidLoop');
addPrototype(pidLoopType, structureType);

addSuffixes(
  pidLoopType,
  createSuffixType('lastSampleTime', scalarType),
  createSetSuffixType('kp', scalarType),
  createSetSuffixType('ki', scalarType),
  createSetSuffixType('kd', scalarType),
  createSuffixType('input', scalarType),
  createSetSuffixType('setPoint', scalarType),
  createSuffixType('error', scalarType),
  createSuffixType('output', scalarType),
  createSetSuffixType('maxOutput', scalarType),
  createSetSuffixType('minOutput', scalarType),
  createSuffixType('errorSum', scalarType),
  createSuffixType('pTerm', scalarType),
  createSuffixType('iTerm', scalarType),
  createSuffixType('dTerm', scalarType),
  createSuffixType('changeRate', scalarType),
  createArgSuffixType('reset', voidType),
  createArgSuffixType('update', scalarType, scalarType, scalarType),
);
