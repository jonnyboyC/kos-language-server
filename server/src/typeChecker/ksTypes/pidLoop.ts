import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
  noMap,
} from '../typeCreators';
import { structureType } from './primitives/structure';
import { voidType } from './primitives/void';
import { scalarType } from './primitives/scalar';

export const pidLoopType = createStructureType('pidLoop');
pidLoopType.addSuper(noMap(structureType));

pidLoopType.addSuffixes(
  noMap(createSuffixType('lastSampleTime', scalarType)),
  noMap(createSetSuffixType('kp', scalarType)),
  noMap(createSetSuffixType('ki', scalarType)),
  noMap(createSetSuffixType('kd', scalarType)),
  noMap(createSuffixType('input', scalarType)),
  noMap(createSetSuffixType('setPoint', scalarType)),
  noMap(createSuffixType('error', scalarType)),
  noMap(createSuffixType('output', scalarType)),
  noMap(createSetSuffixType('maxOutput', scalarType)),
  noMap(createSetSuffixType('minOutput', scalarType)),
  noMap(createSuffixType('errorSum', scalarType)),
  noMap(createSuffixType('pTerm', scalarType)),
  noMap(createSuffixType('iTerm', scalarType)),
  noMap(createSuffixType('dTerm', scalarType)),
  noMap(createSuffixType('changeRate', scalarType)),
  noMap(createArgSuffixType('reset', voidType)),
  noMap(createArgSuffixType('update', scalarType, scalarType, scalarType)),
);
