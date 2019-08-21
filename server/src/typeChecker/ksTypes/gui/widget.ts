import { structureType } from '../primitives/structure';
import {
  createSetSuffixType,
  createSuffixType,
  createArgSuffixType,
  createType,
  noMap,
} from '../../typeCreators';
import { widgetStyleType } from './widgetStyle';
import { guiWidgetType } from './guiWidget';
import { voidType } from '../primitives/void';
import { booleanType } from '../primitives/boolean';

export const widgetType = createType('widget');
widgetType.addSuper(noMap(structureType));

widgetType.addSuffixes(
  noMap(createSetSuffixType('enabled', booleanType)),
  noMap(createSetSuffixType('visible', booleanType)),
  noMap(createArgSuffixType('show', voidType)),
  noMap(createArgSuffixType('hide', voidType)),
  noMap(createArgSuffixType('dispose', voidType)),
  noMap(createSetSuffixType('style', widgetStyleType)),
  noMap(createSuffixType('gui', guiWidgetType)),
  noMap(createSuffixType('parent', widgetType)),
);
