import {
  createGenericStructureType,
  createGenericArgSuffixType,
  passThroughMap,
  createArgSuffixType,
  noMap,
} from '../../typeCreators';
import { enumerableType } from './enumerable';
import { voidType } from '../primitives/void';

export const queueType = createGenericStructureType('queue');
queueType.addSuper(passThroughMap(enumerableType, queueType));

const [tType] = queueType.getTypeParameters();

queueType.addSuffixes(
  passThroughMap(queueType, createGenericArgSuffixType('copy', queueType)),
  passThroughMap(
    queueType,
    createGenericArgSuffixType('push', voidType, tType.placeHolder),
  ),
  passThroughMap(
    queueType,
    createGenericArgSuffixType('pop', tType.placeHolder),
  ),
  passThroughMap(
    queueType,
    createGenericArgSuffixType('peek', tType.placeHolder),
  ),
  noMap(createArgSuffixType('clear', voidType)),
);
