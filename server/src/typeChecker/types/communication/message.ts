import { IArgumentType } from '../types';
import { createStructureType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';
import { serializableStructureType } from '../primitives/serializeableStructure';

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
