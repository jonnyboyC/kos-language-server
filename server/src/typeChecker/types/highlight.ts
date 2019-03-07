import { IArgumentType } from './types';
import { createStructureType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from './primitives/structure';
import { rgbaType } from './rgba';
import { booleanType } from './primitives/boolean';

export const highlightType: IArgumentType = createStructureType('highlight');
addPrototype(highlightType, structureType);

addSuffixes(
  highlightType,
  createSetSuffixType('color', rgbaType),
  createSetSuffixType('enabled', booleanType),
);
