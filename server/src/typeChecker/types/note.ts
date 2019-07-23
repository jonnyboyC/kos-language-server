import { ArgumentType } from './types';
import { createStructureType, createSuffixType } from "../typeCreators";
import { addPrototype, addSuffixes } from '../typeUtilities';
import { doubleType } from './primitives/scalar';
import { serializableStructureType } from './primitives/serializeableStructure';

export const noteType: ArgumentType = createStructureType('note');
addPrototype(noteType, serializableStructureType);

addSuffixes(
  noteType,
  createSuffixType('frequency', doubleType),
  createSuffixType('endFrequency', doubleType),
  createSuffixType('volume', doubleType),
  createSuffixType('keyDownLength', doubleType),
  createSuffixType('duration', doubleType),
);
