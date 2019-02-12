import { IArgumentType } from '../types';
import { createStructureType, createArgSuffixType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from '../structure';
import { booleanType, scalarType } from '../primitives';
import { messageType } from './message';
import { voidType } from '../void';

export const messageQueueType: IArgumentType = createStructureType('messageQueue');
addPrototype(messageQueueType, structureType);

addSuffixes(
  messageQueueType,
  createArgSuffixType('empty', booleanType),
  createArgSuffixType('length', scalarType),
  createArgSuffixType('pop', messageType),
  createArgSuffixType('peek', messageType),
  createArgSuffixType('clear', voidType),
  createArgSuffixType('push', voidType, structureType),
);
