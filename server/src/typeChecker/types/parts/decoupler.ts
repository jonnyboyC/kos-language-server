import { createStructureType } from '../ksType';
import { IArgumentType } from '../types';
import { addPrototype } from '../../typeUitlities';
import { partType } from './part';

export const decouplerType: IArgumentType = createStructureType('decoupler');
addPrototype(decouplerType, partType);
