import { IArgumentType } from '../types';
import { structureType } from '../primitives/structure';
import {
  createSetSuffixType, createSuffixType,
  createStructureType,
} from '../ksType';
import { booleanType, scalarType, stringType, integarType } from '../primitives/primitives';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { rgbaType } from '../rgba';
import { widgetStyleStateType } from './widgetStyleState';

export const widgetStyleType: IArgumentType = createStructureType('widgetStyle');
addPrototype(widgetStyleType, structureType);

addSuffixes(
  widgetStyleType,
  createSuffixType('margin', widgetStyleStateType),
  createSuffixType('padding', widgetStyleStateType),
  createSuffixType('border', widgetStyleStateType),
  createSuffixType('overflow', widgetStyleStateType),
  createSetSuffixType('width', scalarType),
  createSetSuffixType('height', scalarType),
  createSetSuffixType('hStretch', booleanType),
  createSetSuffixType('vStretch', booleanType),
  createSetSuffixType('bg', stringType),
  createSetSuffixType('textColor', rgbaType),
  createSuffixType('normal', widgetStyleStateType),
  createSuffixType('focused', widgetStyleStateType),
  createSuffixType('active', widgetStyleStateType),
  createSuffixType('hover', widgetStyleStateType),
  createSuffixType('on', widgetStyleStateType),
  createSuffixType('normal_on', widgetStyleStateType),
  createSuffixType('active_on', widgetStyleStateType),
  createSuffixType('focused_on', widgetStyleStateType),
  createSuffixType('hover_on', widgetStyleStateType),
  createSetSuffixType('font', stringType),
  createSetSuffixType('fontSize', integarType),
  createSetSuffixType('richText', booleanType),
  createSetSuffixType('align', stringType),
);
