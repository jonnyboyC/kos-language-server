import { IArgumentType } from './types';
import { createStructureType, createSuffixType, createArgSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { serializableStructureType } from './structure';
import { scalarType, stringType, integarType, booleanType } from './primitives';
import { listType } from './collections/list';
import { voidType } from './void';

export const timeWarpType: IArgumentType = createStructureType('timeWarp');
addPrototype(timeWarpType, serializableStructureType);

addSuffixes(
  timeWarpType,
  createSuffixType('rate', scalarType),
  createSuffixType('rateList', listType.toConcreteType(scalarType)),
  createSuffixType('railRateList', listType.toConcreteType(scalarType)),
  createSuffixType('physicsRateList', listType.toConcreteType(scalarType)),
  createSuffixType('mode', stringType),
  createSuffixType('warp', integarType),
  createArgSuffixType('warpTo', scalarType),
  createArgSuffixType('cancelWarp', voidType),
  createArgSuffixType('physicsDeltaT', scalarType),
  createArgSuffixType('isSettled', booleanType),
);
