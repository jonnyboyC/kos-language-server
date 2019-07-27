import { IGenericArgumentType } from '../types';
import {
  createArgSuffixType,
  createGenericBasicType,
  tType,
  createGenericArgSuffixType,
} from '../../typeCreators';
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { enumeratorType } from './enumerator';
import { iterator } from '../../../utilities/constants';
import { integerType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';
import { voidType } from '../primitives/void';
import { serializableStructureType } from '../primitives/serializeableStructure';

export const enumerableType: IGenericArgumentType = createGenericBasicType(
  'enumerable',
);
addPrototype(enumerableType, serializableStructureType);

addSuffixes(
  enumerableType,
  createGenericArgSuffixType(iterator, enumeratorType),
  createGenericArgSuffixType('reverseIterator', enumeratorType),
  createArgSuffixType('length', integerType),
  createGenericArgSuffixType('contains', booleanType, tType),
  createArgSuffixType('empty', booleanType),
  createArgSuffixType('dump', stringType),
);

export const collectionType: IGenericArgumentType = createGenericBasicType(
  'collection',
);
addPrototype(collectionType, enumerableType);

addSuffixes(collectionType, createArgSuffixType('clear', voidType));
