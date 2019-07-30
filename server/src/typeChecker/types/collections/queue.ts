import { IGenericArgumentType } from '../types';
import { createGenericStructureType, tType, createGenericArgSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { enumerableType } from './enumerable';
import { voidType } from '../primitives/void';

export const queueType = createGenericStructureType('queue');

queueType.addSuper(enumerableType);

queueType.addSuffixes(
  createGenericArgSuffixType('copy', queueType),
  createGenericArgSuffixType('push', voidType, tType),
  createGenericArgSuffixType('pop', tType),
  createGenericArgSuffixType('peek', tType),
  createGenericArgSuffixType('clear', voidType),
);
