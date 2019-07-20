import { ArgumentType } from '../types';
import { createStructureType, createArgSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { structureType } from '../primitives/structure';

import { messageType } from './message';
import { voidType } from '../primitives/void';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';

export const messageQueueType: ArgumentType = createStructureType('messageQueue');
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
