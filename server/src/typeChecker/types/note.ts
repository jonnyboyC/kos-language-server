import { createStructureType, createSuffixType } from '../typeCreators';
import { doubleType } from './primitives/scalar';
import { serializableStructureType } from './primitives/serializeableStructure';

export const noteType = createStructureType('note');
noteType.addSuper(serializableStructureType);

noteType.addSuffixes(
  createSuffixType('frequency', doubleType),
  createSuffixType('endFrequency', doubleType),
  createSuffixType('volume', doubleType),
  createSuffixType('keyDownLength', doubleType),
  createSuffixType('duration', doubleType),
);
