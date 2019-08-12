import {
  createGenericStructureType,
  createGenericArgSuffixType,
  passThroughMap,
} from '../../typeCreators';
import { voidType } from '../primitives/void';
import { scalarType } from '../primitives/scalar';
import { collectionType } from './enumerable';

export const uniqueSetType = createGenericStructureType('uniqueSet');
uniqueSetType.addSuper(passThroughMap(collectionType, uniqueSetType));

const [tType] = uniqueSetType.getTypeParameters();

uniqueSetType.addSuffixes(
  passThroughMap(
    uniqueSetType,
    createGenericArgSuffixType('copy', uniqueSetType),
  ),
  passThroughMap(
    uniqueSetType,
    createGenericArgSuffixType('add', voidType, tType.placeHolder),
  ),
  passThroughMap(
    uniqueSetType,
    createGenericArgSuffixType('remove', tType.placeHolder, scalarType),
  ),
);
