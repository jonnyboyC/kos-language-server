import { ArgumentType } from './types';
import { createStructureType, createSetSuffixType } from "../typeCreators";
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from './primitives/structure';
import { rgbaType } from './rgba';
import { booleanType } from './primitives/boolean';

export const highlightType: ArgumentType = createStructureType('highlight');
addPrototype(highlightType, structureType);

addSuffixes(
  highlightType,
  createSetSuffixType('color', rgbaType),
  createSetSuffixType('enabled', booleanType),
);
