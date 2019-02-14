import { IArgumentType } from '../types';
import { createStructureType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { serializableStructureType } from '../primitives/structure';
import { enumeratorType } from '../collections/enumerator';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';

export const fileContentType: IArgumentType = createStructureType('fileContent');
addPrototype(fileContentType, serializableStructureType);

addSuffixes(
  fileContentType,
  createSuffixType('length', scalarType),
  createSuffixType('empty', booleanType),
  createSuffixType('type', stringType),
  createSuffixType('string', stringType),
  createSuffixType('iterator', enumeratorType),
);
