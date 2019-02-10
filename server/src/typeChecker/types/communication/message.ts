import { IArgumentType } from '../types';
import { createStructureType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType, serializableStructureType } from '../structure';
import { booleanType, scalarType } from '../primitives';

export const messageType: IArgumentType = createStructureType('message');
addPrototype(messageType, serializableStructureType);

addSuffixes(
  messageType,
  createSuffixType('sentAt', booleanType),
  createSuffixType('receivedAt', scalarType),
  createSuffixType('sender', structureType),
  createSuffixType('hasSender', structureType),
  createSuffixType('content', structureType),
);
