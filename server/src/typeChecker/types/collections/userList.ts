import { listType } from './list';
import { structureType } from '../primitives/structure';

export const userListType = listType.toConcreteType(structureType);
