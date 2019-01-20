import { IGenericType } from '../types';
import {
  createGenericStructureType,
  tType, createGenericArgSuffixType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { collectionType } from './collection';
import { scalarType } from '../primitives';
import { voidType } from '../void';

export const uniqueSetType: IGenericType = createGenericStructureType('uniqueSet');

addPrototype(uniqueSetType, collectionType);

addSuffixes(
  uniqueSetType,
  createGenericArgSuffixType('copy', uniqueSetType),
  createGenericArgSuffixType('add', voidType, tType),
  createGenericArgSuffixType('remove', tType, scalarType),
);
