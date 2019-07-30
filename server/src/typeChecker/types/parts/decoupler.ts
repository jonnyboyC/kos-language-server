import { createStructureType } from '../../typeCreators';
import { partType } from './part';

export const decouplerType = createStructureType('decoupler');
decouplerType.addSuper(partType);
