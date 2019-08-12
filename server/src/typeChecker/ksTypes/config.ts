import { createStructureType, createSetSuffixType, noMap } from '../typeCreators';
import { structureType } from './primitives/structure';
import { scalarType } from './primitives/scalar';
import { booleanType } from './primitives/boolean';

export const configType = createStructureType('config');
configType.addSuper(noMap(structureType));

configType.addSuffixes(
  noMap(createSetSuffixType('ipu', scalarType)),
  noMap(createSetSuffixType('ucp', booleanType)),
  noMap(createSetSuffixType('stat', booleanType)),
  noMap(createSetSuffixType('arch', booleanType)),
  noMap(createSetSuffixType('obeyHideUi', booleanType)),
  noMap(createSetSuffixType('safe', booleanType)),
  noMap(createSetSuffixType('audioErr', booleanType)),
  noMap(createSetSuffixType('verbose', booleanType)),
  noMap(createSetSuffixType('debugEachOpCode', booleanType)),
  noMap(createSetSuffixType('blizzy', booleanType)),
  noMap(createSetSuffixType('brightness', scalarType)),
  noMap(createSetSuffixType('defaultFontSize', scalarType)),
);
