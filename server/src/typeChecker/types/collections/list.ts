import { IGenericArgumentType } from '../types';
import { createArgSuffixType, createGenericBasicType, tType, createGenericArgSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { voidType } from '../primitives/void';
import { scalarType } from '../primitives/scalar';
import { collectionType } from './enumerable';

export const listType: IGenericArgumentType = createGenericBasicType('list');

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
