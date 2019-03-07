import { IGenericArgumentType } from '../types';
import {
  createGenericStructureType,
  tType, createGenericArgSuffixType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { voidType } from '../primitives/void';
import { scalarType } from '../primitives/scalar';
import { collectionType } from './enumerable';

export const uniqueSetType: IGenericArgumentType = createGenericStructureType('uniqueSet');
addPrototype(uniqueSetType, collectionType);

addSuffixes(
  uniqueSetType,
  createGenericArgSuffixType('copy', uniqueSetType),
  createGenericArgSuffixType('add', voidType, tType),
  createGenericArgSuffixType('remove', tType, scalarType),
);
