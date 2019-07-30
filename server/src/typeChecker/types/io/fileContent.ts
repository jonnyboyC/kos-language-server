import { createStructureType, createSuffixType } from '../../typeCreators';
import { enumeratorType } from '../collections/enumerator';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';
import { serializableStructureType } from '../primitives/serializeableStructure';

export const fileContentType = createStructureType('fileContent');
fileContentType.addSuper(serializableStructureType);

fileContentType.addSuffixes(
  createSuffixType('length', scalarType),
  createSuffixType('empty', booleanType),
  createSuffixType('type', stringType),
  createSuffixType('string', stringType),
  createSuffixType('iterator', enumeratorType.toConcreteType(stringType)),
);
