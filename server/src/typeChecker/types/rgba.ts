import {
  createStructureType,
  createArgSuffixType,
  createSetSuffixType,
} from '../typeCreators';
import { scalarType } from './primitives/scalar';
import { serializableStructureType } from './primitives/serializeableStructure';

export const rgbaType = createStructureType('rgba');
rgbaType.addSuper(serializableStructureType);

rgbaType.addSuffixes(
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
