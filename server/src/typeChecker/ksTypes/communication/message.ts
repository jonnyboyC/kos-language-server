import {
  createType,
  createSuffixType,
  noMap,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';
import { serializableType } from '../primitives/serializeableStructure';

export const messageType = createType('message');
messageType.addSuper(noMap(serializableType));

messageType.addSuffixes(
  noMap(createSuffixType('sentAt', booleanType)),
  noMap(createSuffixType('receivedAt', scalarType)),
  noMap(createSuffixType('sender', structureType)),
  noMap(createSuffixType('hasSender', structureType)),
  noMap(createSuffixType('content', structureType)),
);
