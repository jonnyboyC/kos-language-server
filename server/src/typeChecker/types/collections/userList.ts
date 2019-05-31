import { ArgumentType } from '../types';
import { listType } from './list';
import { structureType } from '../primitives/structure';

export const userListType: ArgumentType = listType.toConcreteType(structureType);
