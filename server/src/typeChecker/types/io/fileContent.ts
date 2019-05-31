import { ArgumentType } from '../types';
import { createStructureType, createSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { enumeratorType } from '../collections/enumerator';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';
import { serializableStructureType } from '../primitives/serializeableStructure';

export const fileContentType: ArgumentType = createStructureType('fileContent');
addPrototype(fileContentType, serializableStructureType);

addSuffixes(
  fileContentType,
  createSuffixType('length', scalarType),
  createSuffixType('empty', booleanType),
  createSuffixType('type', stringType),
  createSuffixType('string', stringType),
  createSuffixType('iterator', enumeratorType.toConcreteType(stringType)),
);
