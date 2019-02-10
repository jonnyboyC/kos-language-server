import { IArgumentType } from '../types';
import { structureType } from '../structure';
import {
  createSetSuffixType, createStructureType,
} from '../ksType';
import { stringType } from '../primitives';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { rgbaType } from '../rgba';

export const widgetStyleStateType: IArgumentType = createStructureType('styleState');
addPrototype(widgetStyleStateType, structureType);

addSuffixes(
  widgetStyleStateType,
  createSetSuffixType('bg', stringType),
  createSetSuffixType('textColor', rgbaType),
);
