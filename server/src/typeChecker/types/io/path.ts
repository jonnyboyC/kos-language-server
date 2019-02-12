import { IArgumentType } from '../types';
import {
  createStructureType, createSuffixType,
  createArgSuffixType, createVarSuffixType,
} from '../ksType';
import { addPrototype, addSuffixes, createVarType } from '../typeUitlities';
import { serializableStructureType, structureType } from '../primitives/structure';
import { booleanType, stringType, integarType } from '../primitives/primitives';
import { volumeType } from './volume';
import { userListType } from '../collections/list';

export const pathType: IArgumentType = createStructureType('path');
addPrototype(pathType, serializableStructureType);

addSuffixes(
  pathType,
  createSuffixType('volume', volumeType),
  createSuffixType('segments', userListType),
  createSuffixType('length', integarType),
  createSuffixType('name', stringType),
  createSuffixType('hasExtension', booleanType),
  createSuffixType('extension', stringType),
  createSuffixType('root', pathType),
  createSuffixType('parent', pathType),
  createArgSuffixType('isParent', pathType, booleanType),
  createArgSuffixType('changeName', pathType, stringType),
  createArgSuffixType('changeExtension', pathType, stringType),
  createVarSuffixType('combine', pathType, createVarType(structureType)),
);
