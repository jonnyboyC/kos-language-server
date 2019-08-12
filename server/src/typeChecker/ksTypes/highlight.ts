import { createStructureType, createSetSuffixType, noMap } from '../typeCreators';
import { structureType } from './primitives/structure';
import { rgbaType } from './rgba';
import { booleanType } from './primitives/boolean';

export const highlightType = createStructureType('highlight');
highlightType.addSuper(noMap(structureType));

highlightType.addSuffixes(
  noMap(createSetSuffixType('color', rgbaType)),
  noMap(createSetSuffixType('enabled', booleanType)),
);
