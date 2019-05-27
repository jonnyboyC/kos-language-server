import { ArgumentType } from '../types';
import { createSetSuffixType, createStructureType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { boxType } from './box';
import { vectorType } from '../collections/vector';
import { booleanType } from '../primitives/boolean';

export const scrollBoxType: ArgumentType = createStructureType('scrollBox');
addPrototype(scrollBoxType, boxType);

addSuffixes(
  scrollBoxType,
  createSetSuffixType('hAlways', booleanType),
  createSetSuffixType('vAlways', booleanType),
  createSetSuffixType('position', vectorType),
);
