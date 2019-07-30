import { createStructureType, createSetSuffixType } from '../typeCreators';
import { rgbaType } from './rgba';
import { scalarType } from './primitives/scalar';

export const hsvaType = createStructureType('hsva');
hsvaType.addSuper(rgbaType);

hsvaType.addSuffixes(
  createSetSuffixType('h', scalarType),
  createSetSuffixType('hue', scalarType),
  createSetSuffixType('s', scalarType),
  createSetSuffixType('saturation', scalarType),
  createSetSuffixType('v', scalarType),
  createSetSuffixType('value', scalarType),
);
