import { ArgumentType } from './types';
import { createStructureType } from '../typeCreators';
import { addPrototype } from '../typeUitlities';
import { delegateType } from './primitives/delegate';

export const builtInDelegateType: ArgumentType = createStructureType(
  'builtInDelegate',
);
addPrototype(builtInDelegateType, delegateType);
