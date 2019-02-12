import { IArgumentType } from './types';
import { createStructureType } from './ksType';
import { addPrototype } from './typeUitlities';
import { delegateType } from './primitives/delegate';

export const userDelegateType: IArgumentType = createStructureType('userDelegate');
addPrototype(userDelegateType, delegateType);
