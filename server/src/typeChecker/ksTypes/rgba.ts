import {
  createType,
  createArgSuffixType,
  createSetSuffixType,
  noMap,
} from '../typeCreators';
import { scalarType } from './primitives/scalar';
import { serializableType } from './primitives/serializeableStructure';

export const rgbaType = createType('rgba');
rgbaType.addSuper(noMap(serializableType));

rgbaType.addSuffixes(
  noMap(createSetSuffixType('r', scalarType)),
  noMap(createSetSuffixType('red', scalarType)),
  noMap(createSetSuffixType('g', scalarType)),
  noMap(createSetSuffixType('green', scalarType)),
  noMap(createSetSuffixType('b', scalarType)),
  noMap(createSetSuffixType('blue', scalarType)),
  noMap(createSetSuffixType('a', scalarType)),
  noMap(createSetSuffixType('alpha', scalarType)),
  noMap(createArgSuffixType('html', scalarType)),
  noMap(createArgSuffixType('hex', scalarType)),
);
