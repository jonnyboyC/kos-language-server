import { IGenericArgumentType, IArgumentType } from '../types';
import {
  createArgSuffixType, createGenericStructureType,
  tType, createGenericArgSuffixType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { collectionType } from './collection';
import { scalarType } from '../primitives/primitives';
import { structureType } from '../primitives/structure';
import { voidType } from '../primitives/void';

export const listType: IGenericArgumentType = createGenericStructureType('list');

addPrototype(listType, collectionType);
addSuffixes(
  listType,
  createGenericArgSuffixType('copy', listType),
  createGenericArgSuffixType('add', voidType, tType),
  createGenericArgSuffixType('insert', voidType, scalarType, tType),
  createArgSuffixType('remove', voidType, scalarType),
  createGenericArgSuffixType('sublist', listType, scalarType, scalarType),
  createGenericArgSuffixType('indexOf', scalarType, tType),
  createGenericArgSuffixType('find', scalarType, tType),
  createGenericArgSuffixType('lastIndexOf', scalarType, tType),
  createGenericArgSuffixType('findLast', scalarType, tType),
);

export const userListType: IArgumentType = listType.toConcreteType(structureType);
