import { IArgumentType } from './types';
import { createStructureType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './primitives/structure';
import { booleanType } from './primitives/primitives';
import { rgbaType } from './rgba';

export const highlightType: IArgumentType = createStructureType('highlight');
addPrototype(highlightType, structureType);

addSuffixes(
  highlightType,
  createSetSuffixType('color', rgbaType),
  createSetSuffixType('enabled', booleanType),
);
