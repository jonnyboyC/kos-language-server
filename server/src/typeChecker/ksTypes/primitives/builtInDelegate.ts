import { createStructureType, noMap } from '../../typeCreators';
import { delegateType } from './delegate';

export const builtInDelegateType = createStructureType('builtInDelegate');
builtInDelegateType.addSuper(noMap(delegateType));
