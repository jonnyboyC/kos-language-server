import { IGenericType } from '../types';
import {
  createGenericStructureType,
  tType, createGenericArgSuffixType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { enumerableType } from './enumerable';
import { voidType } from '../void';

export const queueType: IGenericType = createGenericStructureType('queue');

addPrototype(queueType, enumerableType);

addSuffixes(
  queueType,
  createGenericArgSuffixType('copy', queueType),
  createGenericArgSuffixType('push', undefined, tType),
  createGenericArgSuffixType('pop', tType),
  createGenericArgSuffixType('peek', tType),
  createGenericArgSuffixType('clear', voidType),
);
