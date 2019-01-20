import { IType } from './types';
import { createStructureType, createArgSuffixType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { scalarType } from './primitives';

export const rgbaType: IType = createStructureType('rgba');
addPrototype(rgbaType, structureType);

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
