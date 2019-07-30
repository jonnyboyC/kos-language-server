import { IGenericArgumentType } from '../types';
import { createGenericStructureType, tType, createGenericArgSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { voidType } from '../primitives/void';
import { scalarType } from '../primitives/scalar';
import { collectionType } from './enumerable';

export const uniqueSetType = createGenericStructureType('uniqueSet');
uniqueSetType.addSuper(collectionType);

uniqueSetType.addSuffixes(
  createGenericArgSuffixType('copy', uniqueSetType),
  createGenericArgSuffixType('add', voidType, tType),
  createGenericArgSuffixType('remove', tType, scalarType),
);
