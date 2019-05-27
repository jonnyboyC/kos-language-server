import { ArgumentType } from '../types';
import { structureType } from '../primitives/structure';
import { createSetSuffixType, createStructureType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { integarType } from '../primitives/scalar';

export const widgetStyleRectOffsetType: ArgumentType = createStructureType('styleRectOffset');
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
