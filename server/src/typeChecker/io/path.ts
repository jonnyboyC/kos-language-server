import { IType } from '../types';
import {
  createStructureType, createSuffixType,
  createArgSuffixType, createVarSuffixType,
} from '../ksType';
import { addPrototype, addSuffixes, createVarType } from '../typeUitlities';
import { serializableStructureType, structureType } from '../structure';
import { booleanType, stringType, integarType } from '../primitives';
import { volumeType } from './volume';
import { listType } from '../collections/list';

export const pathType: IType = createStructureType('path');
addPrototype(pathType, serializableStructureType);

addSuffixes(
  pathType,
  createSuffixType('volume', volumeType),
  createSuffixType('segments', listType.toConcreteType(structureType)),
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
