import {
  createGenericStructureType,
  createGenericArgSuffixType,
  passThroughMap,
  noMap,
  createArgSuffixType,
} from '../../typeCreators';
import { enumerableType } from './enumerable';
import { voidType } from '../primitives/void';

export const stackType = createGenericStructureType('stack');
stackType.addSuper(passThroughMap(enumerableType, stackType));
const [tType] = stackType.getTypeParameters();

stackType.addSuffixes(
  passThroughMap(stackType, createGenericArgSuffixType('copy', stackType)),
  passThroughMap(
    stackType,
    createGenericArgSuffixType('push', voidType, tType.placeHolder),
  ),
  passThroughMap(
    stackType,
    createGenericArgSuffixType('pop', tType.placeHolder),
  ),
  passThroughMap(
    stackType,
    createGenericArgSuffixType('peek', tType.placeHolder),
  ),
  noMap(createArgSuffixType('clear', voidType)),
);
