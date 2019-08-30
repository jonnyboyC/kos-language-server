import {
  createType,
  createSuffixType,
  createSetSuffixType,
  noMap,
} from '../utilities/typeCreators';
import { structureType } from './primitives/structure';
import { stringType } from './primitives/string';
import { scalarType } from './primitives/scalar';
import { booleanType } from './primitives/boolean';

export const kacAlarmType = createType('kacAlarm');
kacAlarmType.addSuper(noMap(structureType));

kacAlarmType.addSuffixes(
  noMap(createSuffixType('id', stringType)),
  noMap(createSetSuffixType('name', stringType)),
  noMap(createSetSuffixType('notes', stringType)),
  noMap(createSetSuffixType('actions', stringType)),
  noMap(createSuffixType('type', stringType)),
  noMap(createSuffixType('remaining', scalarType)),
  noMap(createSetSuffixType('time', scalarType)),
  noMap(createSetSuffixType('margin', scalarType)),
  noMap(createSetSuffixType('repeat', booleanType)),
  noMap(createSetSuffixType('repeatPeriod', scalarType)),
  noMap(createSetSuffixType('originBody', stringType)),
  noMap(createSetSuffixType('targetBody', stringType)),
);
