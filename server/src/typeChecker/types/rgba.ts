import { ArgumentType } from './types';
import {
  createStructureType,
  createArgSuffixType,
  createSetSuffixType,
} from '../typeCreators';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { scalarType } from './primitives/scalar';
import { serializableStructureType } from './primitives/serializeableStructure';

export const rgbaType: ArgumentType = createStructureType('rgba');
addPrototype(rgbaType, serializableStructureType);

addSuffixes(
  rgbaType,
  createSetSuffixType('r', scalarType),
  createSetSuffixType('red', scalarType),
  createSetSuffixType('g', scalarType),
  createSetSuffixType('green', scalarType),
  createSetSuffixType('b', scalarType),
  createSetSuffixType('blue', scalarType),
  createSetSuffixType('a', scalarType),
  createSetSuffixType('alpha', scalarType),
  createArgSuffixType('html', scalarType),
  createArgSuffixType('hex', scalarType),
);
