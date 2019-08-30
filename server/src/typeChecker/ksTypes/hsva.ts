import {
  createType,
  createSetSuffixType,
  noMap,
} from '../utilities/typeCreators';
import { rgbaType } from './rgba';
import { scalarType } from './primitives/scalar';

export const hsvaType = createType('hsva');
hsvaType.addSuper(noMap(rgbaType));

hsvaType.addSuffixes(
  noMap(createSetSuffixType('h', scalarType)),
  noMap(createSetSuffixType('hue', scalarType)),
  noMap(createSetSuffixType('s', scalarType)),
  noMap(createSetSuffixType('saturation', scalarType)),
  noMap(createSetSuffixType('v', scalarType)),
  noMap(createSetSuffixType('value', scalarType)),
);
