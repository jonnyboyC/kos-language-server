import { IGenericArgumentType } from '../types';
import { createGenericBasicType, tType, createGenericArgSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { enumerableType } from './enumerable';
import { voidType } from '../primitives/void';

export const queueType: IGenericArgumentType = createGenericBasicType('queue');

addPrototype(queueType, enumerableType);

addSuffixes(
  queueType,
  createGenericArgSuffixType('copy', queueType),
  createGenericArgSuffixType('push', voidType, tType),
  createGenericArgSuffixType('pop', tType),
  createGenericArgSuffixType('peek', tType),
  createGenericArgSuffixType('clear', voidType),
);
