import {
  createGenericStructureType,
  createGenericArgSuffixType,
} from '../../typeCreators';
import { enumerableType } from './enumerable';
import { voidType } from '../primitives/void';
import { passThroughTypeParameter } from '../../typeUtilities';

export const stackType = createGenericStructureType('stack');
stackType.addSuper(
  enumerableType,
  passThroughTypeParameter(stackType, enumerableType),
);
const [tType] = stackType.getTypeParameters();

stackType.addSuffixes(
  createGenericArgSuffixType('copy', stackType),
  createGenericArgSuffixType('push', voidType, tType.placeHolder),
  createGenericArgSuffixType('pop', tType.placeHolder),
  createGenericArgSuffixType('peek', tType.placeHolder),
  createGenericArgSuffixType('clear', voidType),
);
