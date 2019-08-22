import { createType, noMap } from '../../typeCreators';
import { delegateType } from './delegate';

export const builtInDelegateType = createType('builtInDelegate');
builtInDelegateType.addSuper(noMap(delegateType));
