import { IType } from '../types';
import {
  createSetSuffixType, createStructureType,
} from '../ksType';
import { booleanType } from '../primitives';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { boxType } from './box';
import { vectorType } from '../collections/vector';

export const scrollBoxType: IType = createStructureType('scrollBox');
addPrototype(scrollBoxType, boxType);

addSuffixes(
  scrollBoxType,
  createSetSuffixType('hAlways', booleanType),
  createSetSuffixType('vAlways', booleanType),
  createSetSuffixType('position', vectorType),
);
