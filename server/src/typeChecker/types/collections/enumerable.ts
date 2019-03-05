import { IGenericArgumentType } from '../types';
import {
  createArgSuffixType, createGenericStructureType,
  tType, createGenericArgSuffixType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { enumeratorType } from './enumerator';
import { iterator } from '../../../utilities/constants';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';
import { voidType } from '../primitives/void';
import { serializableStructureType } from '../primitives/serializeableStructure';

export const enumerableType: IGenericArgumentType = createGenericStructureType('enumerable');
addPrototype(enumerableType, serializableStructureType);

addSuffixes(
  enumerableType,
  createArgSuffixType(iterator, enumeratorType),
  createArgSuffixType('reverseIterator', enumeratorType),
  createArgSuffixType('length', scalarType),
  createGenericArgSuffixType('contains', booleanType, tType),
  createArgSuffixType('empty', booleanType),
  createArgSuffixType('dump', stringType),
);

export const collectionType: IGenericArgumentType = createGenericStructureType('collection');
addPrototype(collectionType, enumerableType);

addSuffixes(
  collectionType,
  createArgSuffixType('clear', voidType),
);
