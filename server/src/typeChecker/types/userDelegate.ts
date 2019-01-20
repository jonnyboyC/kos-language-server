import { IType } from './types';
import { createStructureType } from './ksType';
import { addPrototype } from './typeUitlities';
import { delegateType } from './delegate';

export const userDelegateType: IType = createStructureType('userDelegate');
addPrototype(userDelegateType, delegateType);
