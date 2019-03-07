import { IArgumentType } from './types';
import { createStructureType } from './ksType';
import { addPrototype } from '../typeUitlities';
import { delegateType } from './primitives/delegate';

export const builtInDelegateType: IArgumentType = createStructureType('builtInDelegate');
addPrototype(builtInDelegateType, delegateType);
