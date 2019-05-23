import { IArgumentType } from '../types';
import { createStructureType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { enumeratorType } from '../collections/enumerator';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';
import { serializableStructureType } from '../primitives/serializeableStructure';

export const fileContentType: IArgumentType = createStructureType('fileContent');
addPrototype(fileContentType, serializableStructureType);

addSuffixes(
  fileContentType,
  createSuffixType('length', scalarType),
  createSuffixType('empty', booleanType),
  createSuffixType('type', stringType),
  createSuffixType('string', stringType),
  createSuffixType('iterator', enumeratorType.toConcreteType(stringType)),
);
