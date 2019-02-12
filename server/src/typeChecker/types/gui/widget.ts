import { IArgumentType } from '../types';
import { structureType } from '../primitives/structure';
import {
  createSetSuffixType, createSuffixType,
  createArgSuffixType, createStructureType,
} from '../ksType';
import { booleanType } from '../primitives/primitives';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { widgetStyleType } from './widgetStyle';
import { guiWidgetType } from './guiWidget';
import { voidType } from '../primitives/void';

export const widgetType: IArgumentType = createStructureType('widget');
addPrototype(widgetType, structureType);

addSuffixes(
  widgetType,
  createSetSuffixType('enabled', booleanType),
  createSetSuffixType('visible', booleanType),
  createArgSuffixType('show', voidType),
  createArgSuffixType('hide', voidType),
  createArgSuffixType('dispose', voidType),
  createSetSuffixType('style', widgetStyleType),
  createSuffixType('gui', guiWidgetType),
  createSuffixType('parent', widgetType),
);
