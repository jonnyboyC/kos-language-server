import {
  createArgSuffixType,
  createGenericStructureType,
  createGenericArgSuffixType,
} from '../../typeCreators';
import { enumeratorType } from './enumerator';
import { iterator } from '../../../utilities/constants';
import { integerType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';
import { voidType } from '../primitives/void';
import { serializableStructureType } from '../primitives/serializeableStructure';

export const enumerableType = createGenericStructureType('enumerable');
enumerableType.addSuper(serializableStructureType);
const typeParameters = enumerableType.getTypeParameters();

enumerableType.addSuffixes(
  createGenericArgSuffixType(iterator, enumeratorType),
  createGenericArgSuffixType('reverseIterator', enumeratorType),
  createArgSuffixType('length', integerType),
  createGenericArgSuffixType(
    'contains',
    booleanType,
    typeParameters[0].placeHolder,
  ),
  createArgSuffixType('empty', booleanType),
  createArgSuffixType('dump', stringType),
);

export const collectionType = createGenericStructureType('collection');
collectionType.addSuper(enumerableType);

collectionType.addSuffixes(createArgSuffixType('clear', voidType));
