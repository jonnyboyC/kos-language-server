import { IGenericArgumentType } from '../types';
import { createArgSuffixType, createGenericStructureType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { enumeratorType } from './enumerator';
import { voidType } from '../void';

export const collectionType: IGenericArgumentType = createGenericStructureType('collection');
addPrototype(collectionType, enumeratorType);

addSuffixes(
  collectionType,
  createArgSuffixType('clear', voidType),
);
