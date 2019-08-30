import {
  createArgSuffixType,
  createType,
  noMap,
} from '../../utilities/typeCreators';
import { enumerableType } from './enumerable';
import { scalarType } from '../primitives/scalar';

export const rangeType = createType('range');
rangeType.addSuper(noMap(enumerableType.apply(scalarType)));

rangeType.addSuffixes(
  noMap(createArgSuffixType('start', scalarType)),
  noMap(createArgSuffixType('stop', scalarType)),
  noMap(createArgSuffixType('step', scalarType)),
);
