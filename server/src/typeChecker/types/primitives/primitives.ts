import { IArgumentType } from '../types';
import { createStructureType } from '../ksType';
import { structureType } from './structure';
import { addPrototype } from '../../typeUitlities';

// ---------- base of all primitive types --------------
export const primitiveType: IArgumentType = createStructureType('primitive');
addPrototype(primitiveType, structureType);
