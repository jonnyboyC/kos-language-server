import { createType, noMap } from '../utilities/typeCreators';
import { delegateType } from './primitives/delegate';

export const userDelegateType = createType('userDelegate');
userDelegateType.addSuper(noMap(delegateType));
