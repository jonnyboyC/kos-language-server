import { IGenericArgumentType } from '../types';
import { createArgSuffixType, createGenericStructureType } from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { enumerableType } from './enumerable';
import { voidType } from '../primitives/void';

export const collectionType: IGenericArgumentType = createGenericStructureType('collection');
addPrototype(collectionType, enumerableType);

addSuffixes(
  collectionType,
  createArgSuffixType('clear', voidType),
);
