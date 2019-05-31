import { IGenericArgumentType } from '../types';
import { createGenericBasicType, tType, createGenericArgSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { voidType } from '../primitives/void';
import { scalarType } from '../primitives/scalar';
import { collectionType } from './enumerable';

export const uniqueSetType: IGenericArgumentType = createGenericBasicType('uniqueSet');
addPrototype(uniqueSetType, collectionType);

addSuffixes(
  uniqueSetType,
  createGenericArgSuffixType('copy', uniqueSetType),
  createGenericArgSuffixType('add', voidType, tType),
  createGenericArgSuffixType('remove', tType, scalarType),
);
