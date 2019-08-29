import { structureType } from '../primitives/structure';
import {
  createSetSuffixType,
  createSuffixType,
  createArgSuffixType,
  createType,
  noMap,
} from '../../utilities/typeCreators';
import { widgetStyleType } from './widgetStyle';
import { guiWidgetType } from './guiWidget';
import { noneType } from '../primitives/none';
import { booleanType } from '../primitives/boolean';

export const widgetType = createType('widget');
widgetType.addSuper(noMap(structureType));

widgetType.addSuffixes(
  noMap(createSetSuffixType('enabled', booleanType)),
  noMap(createSetSuffixType('visible', booleanType)),
  noMap(createArgSuffixType('show', noneType)),
  noMap(createArgSuffixType('hide', noneType)),
  noMap(createArgSuffixType('dispose', noneType)),
  noMap(createSetSuffixType('style', widgetStyleType)),
  noMap(createSuffixType('gui', guiWidgetType)),
  noMap(createSuffixType('parent', widgetType)),
);
