import {
  createStructureType,
  createSuffixType,
  createArgSuffixType,
} from '../typeCreators';
import { listType } from './collections/list';
import { voidType } from './primitives/void';
import { scalarType, integerType } from './primitives/scalar';
import { stringType } from './primitives/string';
import { booleanType } from './primitives/boolean';
import { serializableStructureType } from './primitives/serializeableStructure';

export const timeWarpType = createStructureType('timeWarp');
timeWarpType.addSuper(serializableStructureType);

timeWarpType.addSuffixes(
  createSuffixType('rate', scalarType),
  createSuffixType('rateList', listType.toConcreteType(scalarType)),
  createSuffixType('railRateList', listType.toConcreteType(scalarType)),
  createSuffixType('physicsRateList', listType.toConcreteType(scalarType)),
  createSuffixType('mode', stringType),
  createSuffixType('warp', integerType),
  createArgSuffixType('warpTo', scalarType),
  createArgSuffixType('cancelWarp', voidType),
  createArgSuffixType('physicsDeltaT', scalarType),
  createArgSuffixType('isSettled', booleanType),
);
