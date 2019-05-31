import { ArgumentType } from '../types';
import { createStructureType, createSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';
import { serializableStructureType } from '../primitives/serializeableStructure';

export const messageType: ArgumentType = createStructureType('message');
addPrototype(messageType, serializableStructureType);

addSuffixes(
  messageType,
  createSuffixType('sentAt', booleanType),
  createSuffixType('receivedAt', scalarType),
  createSuffixType('sender', structureType),
  createSuffixType('hasSender', structureType),
  createSuffixType('content', structureType),
);
