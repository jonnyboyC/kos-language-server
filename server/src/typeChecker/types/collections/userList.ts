import { IArgumentType } from '../types';
import { listType } from './list';
import { structureType } from '../primitives/structure';

export const userListType: IArgumentType = listType.toConcreteType(structureType);
