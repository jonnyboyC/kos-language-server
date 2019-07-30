import {
  createArgSuffixType,
  createGenericStructureType,
  createGenericArgSuffixType,
} from '../../typeCreators';
import { voidType } from '../primitives/void';
import { scalarType } from '../primitives/scalar';
import { collectionType } from './enumerable';
import { stringType } from '../primitives/string';

export const listType = createGenericStructureType('list');

listType.addSuper(collectionType);
listType.addSuffixes(
  createGenericArgSuffixType('copy', listType),
  createGenericArgSuffixType('add', voidType, tType),
  createGenericArgSuffixType('insert', voidType, scalarType, tType),
  createArgSuffixType('remove', voidType, scalarType),
  createGenericArgSuffixType('sublist', listType, scalarType, scalarType),
  createArgSuffixType('join', stringType, stringType),
  createGenericArgSuffixType('indexOf', scalarType, tType),
  createGenericArgSuffixType('find', scalarType, tType),
  createGenericArgSuffixType('lastIndexOf', scalarType, tType),
  createGenericArgSuffixType('findLast', scalarType, tType),
);
