import {
  createGenericStructureType,
  createGenericArgSuffixType,
  mapTypes,
  noMap,
  createArgSuffixType,
} from '../../typeCreators';
import { enumerableType } from './enumerable';
import { voidType } from '../primitives/void';

export const stackType = createGenericStructureType('stack', ['T']);
stackType.addSuper(mapTypes(stackType, enumerableType));

const copySuffix = createGenericArgSuffixType('copy', ['T'], stackType);
const pushSuffix = createGenericArgSuffixType('push', ['T'], voidType, 'T');
const popSuffix = createGenericArgSuffixType('pop', ['T'], 'T');
const peekSuffix = createGenericArgSuffixType('peek', ['T'], 'T');

stackType.addSuffixes(
  mapTypes(stackType, copySuffix),
  mapTypes(stackType, pushSuffix),
  mapTypes(stackType, popSuffix),
  mapTypes(stackType, peekSuffix),
  noMap(createArgSuffixType('clear', voidType)),
);
