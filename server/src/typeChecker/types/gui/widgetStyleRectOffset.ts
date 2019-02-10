import { IArgumentType } from '../types';
import { structureType } from '../structure';
import {
  createSetSuffixType, createStructureType,
} from '../ksType';
import { integarType } from '../primitives';
import { addPrototype, addSuffixes } from '../typeUitlities';

export const widgetStyleRectOffsetType: IArgumentType = createStructureType('styleRectOffset');
addPrototype(widgetStyleRectOffsetType, structureType);

addSuffixes(
  widgetStyleRectOffsetType,
  createSetSuffixType('h', integarType),
  createSetSuffixType('v', integarType),
  createSetSuffixType('left', integarType),
  createSetSuffixType('right', integarType),
  createSetSuffixType('top', integarType),
  createSetSuffixType('bottom', integarType),
);
