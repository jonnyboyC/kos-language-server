import { IArgumentType } from './types';
import { createStructureType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { serializableStructureType } from './primitives/structure';
import { scalarType, stringType } from './primitives/primitives';

export const timeSpanType: IArgumentType = createStructureType('timeSpan');
addPrototype(timeSpanType, serializableStructureType);

addSuffixes(
  timeSpanType,
  createSuffixType('year', scalarType),
  createSuffixType('day', scalarType),
  createSuffixType('hour', scalarType),
  createSuffixType('minute', scalarType),
  createSuffixType('second', scalarType),
  createSuffixType('seconds', scalarType),
  createSuffixType('clock', stringType),
  createSuffixType('calendar', stringType),
);
