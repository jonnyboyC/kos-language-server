import {
  createParametricType,
  createParametricArgSuffixType,
  mapTypes,
  noMap,
  createArgSuffixType,
} from '../../utilities/typeCreators';
import { enumerableType } from './enumerable';
import { noneType } from '../primitives/none';

export const stackType = createParametricType('stack', ['T']);
stackType.addSuper(mapTypes(stackType, enumerableType));

const copySuffix = createParametricArgSuffixType('copy', ['T'], stackType);
const pushSuffix = createParametricArgSuffixType('push', ['T'], noneType, 'T');
const popSuffix = createParametricArgSuffixType('pop', ['T'], 'T');
const peekSuffix = createParametricArgSuffixType('peek', ['T'], 'T');

stackType.addSuffixes(
  mapTypes(stackType, copySuffix),
  mapTypes(stackType, pushSuffix),
  mapTypes(stackType, popSuffix),
  mapTypes(stackType, peekSuffix),
  noMap(createArgSuffixType('clear', noneType)),
);
