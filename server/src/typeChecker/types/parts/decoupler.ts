import { createStructureType } from "../../typeCreators";
import { ArgumentType } from '../types';
import { addPrototype } from '../../typeUitlities';
import { partType } from './part';

export const decouplerType: ArgumentType = createStructureType('decoupler');
addPrototype(decouplerType, partType);
