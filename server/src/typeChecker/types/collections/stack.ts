import { IGenericArgumentType } from '../types';
import { createGenericBasicType, tType, createGenericArgSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { enumerableType } from './enumerable';
import { voidType } from '../primitives/void';

export const stackType: IGenericArgumentType = createGenericBasicType('stack');
addPrototype(stackType, enumerableType);

addSuffixes(
  stackType,
  createGenericArgSuffixType('copy', stackType),
  createGenericArgSuffixType('push', voidType, tType),
  createGenericArgSuffixType('pop', tType),
  createGenericArgSuffixType('peek', tType),
  createGenericArgSuffixType('clear', voidType),
);
