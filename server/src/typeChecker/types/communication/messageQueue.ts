import { createStructureType, createArgSuffixType } from '../../typeCreators';
import { structureType } from '../primitives/structure';

import { messageType } from './message';
import { voidType } from '../primitives/void';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';

export const messageQueueType = createStructureType('messageQueue');
messageQueueType.addSuper(structureType);

messageQueueType.addSuffixes(
  createArgSuffixType('empty', booleanType),
  createArgSuffixType('length', scalarType),
  createArgSuffixType('pop', messageType),
  createArgSuffixType('peek', messageType),
  createArgSuffixType('clear', voidType),
  createArgSuffixType('push', voidType, structureType),
);
