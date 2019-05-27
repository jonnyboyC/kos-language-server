import { ArgumentType } from '../types';
import {
  createStructureType,
  createSuffixType,
  createArgSuffixType,
  createVarSuffixType,
  createVarType,
} from '../../typeCreators';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { structureType } from '../primitives/structure';
import { volumeType } from './volume';
import { userListType } from '../collections/userList';
import { integarType } from '../primitives/scalar';
import { stringType } from '../primitives/string';
import { booleanType } from '../primitives/boolean';
import { serializableStructureType } from '../primitives/serializeableStructure';

export const pathType: ArgumentType = createStructureType('path');
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
