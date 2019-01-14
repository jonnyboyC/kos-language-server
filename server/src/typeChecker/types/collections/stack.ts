import { IGenericType } from '../types';
import {
  createGenericStructureType,
  tType, createGenericArgSuffixType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { enumerableType } from './enumerable';
import { voidType } from '../void';

export const stackType: IGenericType = createGenericStructureType('stack');
addPrototype(stackType, enumerableType);

addSuffixes(
  stackType,
  createGenericArgSuffixType('copy', stackType),
  createGenericArgSuffixType('push', undefined, tType),
  createGenericArgSuffixType('pop', tType),
  createGenericArgSuffixType('peek', tType),
  createGenericArgSuffixType('clear', voidType),
);
