import { IGenericArgumentType } from '../types';
import { createGenericStructureType, tType, createGenericArgSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { enumerableType } from './enumerable';
import { voidType } from '../primitives/void';

export const stackType = createGenericStructureType('stack');
stackType.addSuper(enumerableType);

stackType.addSuffixes(
  createGenericArgSuffixType('copy', stackType),
  createGenericArgSuffixType('push', voidType, tType),
  createGenericArgSuffixType('pop', tType),
  createGenericArgSuffixType('peek', tType),
  createGenericArgSuffixType('clear', voidType),
);
