import { IGenericArgumentType } from '../types';
import {
  createGenericStructureType,
  tType, createGenericArgSuffixType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { enumerableType } from './enumerable';
import { voidType } from '../primitives/void';

export const stackType: IGenericArgumentType = createGenericStructureType('stack');
addPrototype(stackType, enumerableType);

addSuffixes(
  stackType,
  createGenericArgSuffixType('copy', stackType),
  createGenericArgSuffixType('push', voidType, tType),
  createGenericArgSuffixType('pop', tType),
  createGenericArgSuffixType('peek', tType),
  createGenericArgSuffixType('clear', voidType),
);
