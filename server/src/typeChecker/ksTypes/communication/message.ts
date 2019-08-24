import { createType, createSuffixType, noMap } from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { serializableType } from '../primitives/serializeableStructure';
import { timeSpanType } from '../timespan';

export const messageType = createType('message');
messageType.addSuper(noMap(serializableType));

messageType.addSuffixes(
  noMap(createSuffixType('sentAt', timeSpanType)),
  noMap(createSuffixType('receivedAt', timeSpanType)),
  noMap(createSuffixType('sender', structureType)),
  noMap(createSuffixType('hasSender', structureType)),
  noMap(createSuffixType('content', structureType)),
);
