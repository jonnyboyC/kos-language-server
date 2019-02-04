import { IArgumentType } from './types';
import { createStructureType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { scalarType } from './primitives';
import { rgbaType } from './rgba';

export const hsvaType: IArgumentType = createStructureType('hsva');
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
