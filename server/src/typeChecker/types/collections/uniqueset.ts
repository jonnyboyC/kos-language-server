import { IGenericArgumentType } from '../types';
import {
  createGenericStructureType,
  tType, createGenericArgSuffixType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { collectionType } from './collection';
import { scalarType } from '../primitives/primitives';
import { voidType } from '../primitives/void';

export const uniqueSetType: IGenericArgumentType = createGenericStructureType('uniqueSet');

addPrototype(uniqueSetType, collectionType);

addSuffixes(
  uniqueSetType,
  createGenericArgSuffixType('copy', uniqueSetType),
  createGenericArgSuffixType('add', voidType, tType),
  createGenericArgSuffixType('remove', tType, scalarType),
);
