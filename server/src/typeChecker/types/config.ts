import { IArgumentType } from './types';
import { createStructureType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from './primitives/structure';
import { scalarType } from './primitives/scalar';
import { booleanType } from './primitives/boolean';

export const configType: IArgumentType = createStructureType('config');
addPrototype(configType, structureType);

addSuffixes(
  configType,
  createSetSuffixType('ipu', scalarType),
  createSetSuffixType('ucp', booleanType),
  createSetSuffixType('stat', booleanType),
  createSetSuffixType('arch', booleanType),
  createSetSuffixType('obeyHideUi', booleanType),
  createSetSuffixType('safe', booleanType),
  createSetSuffixType('audioErr', booleanType),
  createSetSuffixType('verbose', booleanType),
  createSetSuffixType('debugEachOpCode', booleanType),
  createSetSuffixType('blizzy', booleanType),
  createSetSuffixType('brightness', scalarType),
  createSetSuffixType('defaultFontSize', scalarType),
);
