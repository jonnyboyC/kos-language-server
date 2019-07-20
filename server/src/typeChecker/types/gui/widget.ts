import { ArgumentType } from '../types';
import { structureType } from '../primitives/structure';
import {
  createSetSuffixType,
  createSuffixType,
  createArgSuffixType,
  createStructureType,
} from '../../typeCreators';
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { widgetStyleType } from './widgetStyle';
import { guiWidgetType } from './guiWidget';
import { voidType } from '../primitives/void';
import { booleanType } from '../primitives/boolean';

export const widgetType: ArgumentType = createStructureType('widget');
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
