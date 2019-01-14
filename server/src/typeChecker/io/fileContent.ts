import { IType } from '../types';
import { createStructureType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { serializableStructureType } from '../structure';
import { booleanType, scalarType, stringType } from '../primitives';
import { enumeratorType } from '../collections/enumerator';

export const fileContentType: IType = createStructureType('fileContent');
addPrototype(fileContentType, serializableStructureType);

addSuffixes(
  fileContentType,
  createSuffixType('length', scalarType),
  createSuffixType('empty', booleanType),
  createSuffixType('type', stringType),
  createSuffixType('string', stringType),
  createSuffixType('iterator', enumeratorType),
);
