import {
  createArgSuffixType,
  createStructureType,
  noMap,
} from '../../typeCreators';
import { enumerableType } from './enumerable';
import { scalarType } from '../primitives/scalar';

export const rangeType = createStructureType('range');
rangeType.addSuper(noMap(enumerableType.toConcrete(scalarType)));

rangeType.addSuffixes(
  noMap(createArgSuffixType('start', scalarType)),
  noMap(createArgSuffixType('stop', scalarType)),
  noMap(createArgSuffixType('step', scalarType)),
);
