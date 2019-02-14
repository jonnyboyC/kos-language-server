import { IArgumentType } from './types';
import { createStructureType, createSuffixType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './primitives/structure';
import { stringType } from './primitives/string';
import { scalarType } from './primitives/scalar';
import { booleanType } from './primitives/boolean';

export const kacAlarmType: IArgumentType = createStructureType('kacAlarm');
addPrototype(kacAlarmType, structureType);

addSuffixes(
  kacAlarmType,
  createSuffixType('id', stringType),
  createSetSuffixType('name', stringType),
  createSetSuffixType('notes', stringType),
  createSetSuffixType('actions', stringType),
  createSuffixType('type', stringType),
  createSuffixType('remaining', scalarType),
  createSetSuffixType('time', scalarType),
  createSetSuffixType('margin', scalarType),
  createSetSuffixType('repeat', booleanType),
  createSetSuffixType('repeatPeriod', scalarType),
  createSetSuffixType('originBody', stringType),
  createSetSuffixType('targetBody', stringType),
);
