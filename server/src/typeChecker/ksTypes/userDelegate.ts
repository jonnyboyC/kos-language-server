import { createStructureType, noMap } from '../typeCreators';
import { delegateType } from './primitives/delegate';

export const userDelegateType = createStructureType('userDelegate');
userDelegateType.addSuper(noMap(delegateType));
