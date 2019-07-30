import { createStructureType, createSetSuffixType } from '../typeCreators';
import { structureType } from './primitives/structure';
import { rgbaType } from './rgba';
import { booleanType } from './primitives/boolean';

export const highlightType = createStructureType('highlight');
highlightType.addSuper(structureType);

highlightType.addSuffixes(
  createSetSuffixType('color', rgbaType),
  createSetSuffixType('enabled', booleanType),
);
