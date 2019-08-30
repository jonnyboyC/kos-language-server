import { createType, createSuffixType, noMap } from '../utilities/typeCreators';
import { doubleType } from './primitives/scalar';
import { serializableType } from './primitives/serializeableStructure';

export const noteType = createType('note');
noteType.addSuper(noMap(serializableType));

noteType.addSuffixes(
  noMap(createSuffixType('frequency', doubleType)),
  noMap(createSuffixType('endFrequency', doubleType)),
  noMap(createSuffixType('volume', doubleType)),
  noMap(createSuffixType('keyDownLength', doubleType)),
  noMap(createSuffixType('duration', doubleType)),
);
