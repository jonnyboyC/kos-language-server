import { IArgumentType } from '../types';
import { createStructureType, createArgSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { structureType } from '../primitives/structure';

import { messageType } from './message';
import { voidType } from '../primitives/void';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';

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
