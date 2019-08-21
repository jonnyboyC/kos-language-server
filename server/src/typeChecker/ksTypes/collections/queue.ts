import {
  createParametricType,
  createParametricArgSuffixType,
  mapTypes,
  createArgSuffixType,
  noMap,
} from '../../typeCreators';
import { enumerableType } from './enumerable';
import { voidType } from '../primitives/void';

export const queueType = createParametricType('queue', ['T']);
queueType.addSuper(mapTypes(queueType, enumerableType));

const copySuffix = createParametricArgSuffixType('copy', ['T'], queueType);
const pushSuffix = createParametricArgSuffixType('push', ['T'], voidType, 'T');
const popSuffix = createParametricArgSuffixType('pop', ['T'], 'T');
const peekSuffix = createParametricArgSuffixType('peek', ['T'], 'T');

queueType.addSuffixes(
  mapTypes(queueType, copySuffix),
  mapTypes(queueType, pushSuffix),
  mapTypes(queueType, popSuffix),
  mapTypes(queueType, peekSuffix),
  noMap(createArgSuffixType('clear', voidType)),
);
