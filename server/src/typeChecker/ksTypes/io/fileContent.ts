import {
  createType,
  createSuffixType,
  noMap,
} from '../../utilities/typeCreators';
import { enumeratorType } from '../collections/enumerator';
import { integerType, scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';
import { serializableType } from '../primitives/serializeableStructure';
import { listType } from '../collections/list';

export const fileContentType = createType('fileContent');
fileContentType.addSuper(noMap(serializableType));

fileContentType.addSuffixes(
  noMap(createSuffixType('length', scalarType)),
  noMap(createSuffixType('empty', booleanType)),
  noMap(createSuffixType('type', stringType)),
  noMap(createSuffixType('string', stringType)),
  noMap(createSuffixType('binary', listType.apply(integerType))),
  noMap(createSuffixType('iterator', enumeratorType.apply(stringType))),
);
