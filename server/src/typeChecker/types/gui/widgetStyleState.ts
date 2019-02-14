import { IArgumentType } from '../types';
import { structureType } from '../primitives/structure';
import {
  createSetSuffixType, createStructureType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { rgbaType } from '../rgba';
import { stringType } from '../primitives/string';

export const widgetStyleStateType: IArgumentType = createStructureType('styleState');
addPrototype(widgetStyleStateType, structureType);

addSuffixes(
  widgetStyleStateType,
  createSetSuffixType('bg', stringType),
  createSetSuffixType('textColor', rgbaType),
);
