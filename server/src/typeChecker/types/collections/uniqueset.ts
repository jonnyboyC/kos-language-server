import {
  createGenericStructureType,
  createGenericArgSuffixType,
} from '../../typeCreators';
import { voidType } from '../primitives/void';
import { scalarType } from '../primitives/scalar';
import { collectionType } from './enumerable';
import { passThroughTypeParameter } from '../../typeUtilities';

export const uniqueSetType = createGenericStructureType('uniqueSet');
uniqueSetType.addSuper(
  collectionType,
  passThroughTypeParameter(uniqueSetType, collectionType),
);

const [tType] = uniqueSetType.getTypeParameters();

uniqueSetType.addSuffixes(
  createGenericArgSuffixType('copy', uniqueSetType),
  createGenericArgSuffixType('add', voidType, tType.placeHolder),
  createGenericArgSuffixType('remove', tType.placeHolder, scalarType),
);
