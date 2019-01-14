import { IGenericType } from '../types';
import {
  createArgSuffixType, createGenericStructureType,
  tType, createGenericArgSuffixType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { serializableStructureType } from '../structure';
import { scalarType, booleanType, stringType } from '../primitives';
import { enumeratorType } from './enumerator';

export const enumerableType: IGenericType = createGenericStructureType('enumerable');
addPrototype(enumerableType, serializableStructureType);

addSuffixes(
  enumerableType,
  createArgSuffixType('iterator', enumeratorType),
  createArgSuffixType('reverseIterator', enumeratorType),
  createArgSuffixType('length', scalarType),
  createGenericArgSuffixType('contains', booleanType, tType),
  createArgSuffixType('empty', booleanType),
  createArgSuffixType('dump', stringType),
);
