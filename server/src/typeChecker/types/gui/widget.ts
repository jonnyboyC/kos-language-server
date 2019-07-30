import { structureType } from '../primitives/structure';
import {
  createSetSuffixType,
  createSuffixType,
  createArgSuffixType,
  createStructureType,
} from '../../typeCreators';
import { widgetStyleType } from './widgetStyle';
import { guiWidgetType } from './guiWidget';
import { voidType } from '../primitives/void';
import { booleanType } from '../primitives/boolean';

export const widgetType = createStructureType('widget');
widgetType.addSuper(structureType);

widgetType.addSuffixes(
  createSetSuffixType('enabled', booleanType),
  createSetSuffixType('visible', booleanType),
  createArgSuffixType('show', voidType),
  createArgSuffixType('hide', voidType),
  createArgSuffixType('dispose', voidType),
  createSetSuffixType('style', widgetStyleType),
  createSuffixType('gui', guiWidgetType),
  createSuffixType('parent', widgetType),
);
