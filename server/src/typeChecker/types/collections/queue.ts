import {
  createGenericStructureType,
  createGenericArgSuffixType,
} from '../../typeCreators';
import { enumerableType } from './enumerable';
import { voidType } from '../primitives/void';
import { passThroughTypeParameter } from '../../typeUtilities';

export const queueType = createGenericStructureType('queue');
queueType.addSuper(
  enumerableType,
  passThroughTypeParameter(queueType, enumerableType),
);

const [tType] = queueType.getTypeParameters();

queueType.addSuffixes(
  createGenericArgSuffixType('copy', queueType),
  createGenericArgSuffixType('push', voidType, tType.placeHolder),
  createGenericArgSuffixType('pop', tType.placeHolder),
  createGenericArgSuffixType('peek', tType.placeHolder),
  createGenericArgSuffixType('clear', voidType),
);
