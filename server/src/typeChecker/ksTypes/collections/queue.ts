import {
  createGenericStructureType,
  createGenericArgSuffixType,
  mapTypes,
  createArgSuffixType,
  noMap,
} from '../../typeCreators';
import { enumerableType } from './enumerable';
import { voidType } from '../primitives/void';

export const queueType = createGenericStructureType('queue', ['T']);
queueType.addSuper(mapTypes(queueType, enumerableType));

const copySuffix = createGenericArgSuffixType('copy', ['T'], queueType);
const pushSuffix = createGenericArgSuffixType('push', ['T'], voidType, 'T');
const popSuffix = createGenericArgSuffixType('pop', ['T'], 'T');
const peekSuffix = createGenericArgSuffixType('peek', ['T'], 'T');

queueType.addSuffixes(
  mapTypes(queueType, copySuffix),
  mapTypes(queueType, pushSuffix),
  mapTypes(queueType, popSuffix),
  mapTypes(queueType, peekSuffix),
  noMap(createArgSuffixType('clear', voidType)),
);
