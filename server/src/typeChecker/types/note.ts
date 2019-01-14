import { IType } from './types';
import { createStructureType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { serializableStructureType } from './structure';
import { doubleType } from './primitives';

export const noteType: IType = createStructureType('note');
addPrototype(noteType, serializableStructureType);

addSuffixes(
  noteType,
  createSuffixType('frequency', doubleType),
  createSuffixType('endFrequency', doubleType),
  createSuffixType('volume', doubleType),
  createSuffixType('keyDownLength', doubleType),
  createSuffixType('duration', doubleType),
);
