import { IGenericArgumentType } from '../types';
import {
  createGenericStructureType,
  tType, createGenericArgSuffixType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { enumerableType } from './enumerable';
import { voidType } from '../primitives/void';

export const queueType: IGenericArgumentType = createGenericStructureType('queue');

addPrototype(queueType, enumerableType);

addSuffixes(
  queueType,
  createGenericArgSuffixType('copy', queueType),
  createGenericArgSuffixType('push', voidType, tType),
  createGenericArgSuffixType('pop', tType),
  createGenericArgSuffixType('peek', tType),
  createGenericArgSuffixType('clear', voidType),
);
