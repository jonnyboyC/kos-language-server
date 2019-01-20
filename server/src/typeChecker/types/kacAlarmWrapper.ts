import { IType } from './types';
import { createStructureType, createSuffixType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { booleanType, stringType, scalarType } from './primitives';

export const kacAlarmType: IType = createStructureType('kacAlarm');
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
