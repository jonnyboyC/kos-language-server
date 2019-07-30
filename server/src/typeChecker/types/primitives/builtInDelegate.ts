import { createStructureType } from '../../typeCreators';
import { delegateType } from './delegate';

export const builtInDelegateType = createStructureType('builtInDelegate');
builtInDelegateType.addSuper(delegateType);
