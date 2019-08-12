import { createStructureType, noMap } from '../../typeCreators';
import { partType } from './part';

export const decouplerType = createStructureType('decoupler');
decouplerType.addSuper(noMap(partType));
