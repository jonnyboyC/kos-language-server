import {
  createStructureType,
  createSuffixType,
  createArgSuffixType,
  noMap,
} from '../typeCreators';
import { listType } from './collections/list';
import { voidType } from './primitives/void';
import { scalarType, integerType } from './primitives/scalar';
import { stringType } from './primitives/string';
import { booleanType } from './primitives/boolean';
import { serializableType } from './primitives/serializeableStructure';

export const timeWarpType = createStructureType('timeWarp');
timeWarpType.addSuper(noMap(serializableType));

timeWarpType.addSuffixes(
  noMap(createSuffixType('rate', scalarType)),
  noMap(createSuffixType('rateList', listType.apply(scalarType))),
  noMap(createSuffixType('railRateList', listType.apply(scalarType))),
  noMap(createSuffixType('physicsRateList', listType.apply(scalarType))),
  noMap(createSuffixType('mode', stringType)),
  noMap(createSuffixType('warp', integerType)),
  noMap(createArgSuffixType('warpTo', scalarType)),
  noMap(createArgSuffixType('cancelWarp', voidType)),
  noMap(createArgSuffixType('physicsDeltaT', scalarType)),
  noMap(createArgSuffixType('isSettled', booleanType)),
);
