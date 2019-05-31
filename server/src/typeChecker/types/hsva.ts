import { ArgumentType } from './types';
import { createStructureType, createSetSuffixType } from "../typeCreators";
import { addPrototype, addSuffixes } from '../typeUitlities';
import { rgbaType } from './rgba';
import { scalarType } from './primitives/scalar';

export const hsvaType: ArgumentType = createStructureType('hsva');
addPrototype(hsvaType, rgbaType);

addSuffixes(
  hsvaType,
  createSetSuffixType('h', scalarType),
  createSetSuffixType('hue', scalarType),
  createSetSuffixType('s', scalarType),
  createSetSuffixType('saturation', scalarType),
  createSetSuffixType('v', scalarType),
  createSetSuffixType('value', scalarType),
);
