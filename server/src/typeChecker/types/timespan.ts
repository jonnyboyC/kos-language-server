import { ArgumentType } from './types';
import { createStructureType, createSuffixType } from "../typeCreators";
import { addPrototype, addSuffixes } from '../typeUitlities';
import { scalarType } from './primitives/scalar';
import { stringType } from './primitives/string';
import { serializableStructureType } from './primitives/serializeableStructure';

export const timeSpanType: ArgumentType = createStructureType('timeSpan');
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
