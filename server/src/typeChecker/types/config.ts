import { createStructureType, createSetSuffixType } from '../typeCreators';
import { structureType } from './primitives/structure';
import { scalarType } from './primitives/scalar';
import { booleanType } from './primitives/boolean';

export const configType = createStructureType('config');
configType.addSuper(structureType);

configType.addSuffixes(
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
