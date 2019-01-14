import { IGenericType } from '../types';
import {
  createArgSuffixType, createGenericStructureType,
  tType, createGenericArgSuffixType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { collectionType } from './collection';
import { scalarType } from '../primitives';

export const listType: IGenericType = createGenericStructureType('list');

addPrototype(listType, collectionType);

addSuffixes(
  listType,
  createGenericArgSuffixType('copy', listType),
  createGenericArgSuffixType('add', undefined, tType),
  createGenericArgSuffixType('insert', undefined, scalarType, tType),
  createArgSuffixType('remove', undefined, scalarType),
  createGenericArgSuffixType('sublist', listType, scalarType, scalarType),
  createGenericArgSuffixType('indexOf', scalarType, tType),
  createGenericArgSuffixType('find', scalarType, tType),
  createGenericArgSuffixType('lastIndexOf', scalarType, tType),
  createGenericArgSuffixType('findLast', scalarType, tType),
);
