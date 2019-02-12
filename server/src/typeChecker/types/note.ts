import { IArgumentType } from './types';
import { createStructureType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { serializableStructureType } from './primitives/structure';
import { doubleType } from './primitives/primitives';

export const noteType: IArgumentType = createStructureType('note');
addPrototype(noteType, serializableStructureType);

addSuffixes(
  noteType,
  createSuffixType('frequency', doubleType),
  createSuffixType('endFrequency', doubleType),
  createSuffixType('volume', doubleType),
  createSuffixType('keyDownLength', doubleType),
  createSuffixType('duration', doubleType),
);
