import { createType, noMap } from '../../utilities/typeCreators';
import { partType } from './part';

export const decouplerType = createType('decoupler');
decouplerType.addSuper(noMap(partType));
