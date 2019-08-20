import {
  createStructureType,
  createSuffixType,
  noMap,
} from '../../typeCreators';
import { enumeratorType } from '../collections/enumerator';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';
import { serializableType } from '../primitives/serializeableStructure';

export const fileContentType = createStructureType('fileContent');
fileContentType.addSuper(noMap(serializableType));

fileContentType.addSuffixes(
  noMap(createSuffixType('length', scalarType)),
  noMap(createSuffixType('empty', booleanType)),
  noMap(createSuffixType('type', stringType)),
  noMap(createSuffixType('string', stringType)),
  noMap(createSuffixType('iterator', enumeratorType.apply(stringType))),
);
