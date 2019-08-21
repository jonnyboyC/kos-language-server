import {
  createSetSuffixType,
  createType,
  createArgSuffixType,
  noMap,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { rgbaType } from '../rgba';
import { widgetStyleType } from './widgetStyle';
import { stringType } from '../primitives/string';
import { booleanType } from '../primitives/boolean';

export const widgetSkinType = createType('skin');
widgetSkinType.addSuper(noMap(structureType));

const builtIns = [
  'box',
  'button',
  'horizontalScrollbar',
  'horizontalScrollbarLeftButton',
  'horizontalScrollbarRightButton',
  'horizontalScrollbarThumb',
  'horizontalSlider',
  'horizontalSliderThumb',
  'verticalScrollbar',
  'verticalScrollbarLeftButton',
  'verticalScrollbarRightButton',
  'verticalScrollbarThumb',
  'verticalSlider',
  'verticalSliderThumb',
  'label',
  'scrollView',
  'textArea',
  'textField',
  'toggle',
  'window',
];

widgetSkinType.addSuffixes(
  noMap(createSetSuffixType('font', stringType)),
  noMap(createSetSuffixType('selectionColor', rgbaType)),
  noMap(createArgSuffixType('add', widgetStyleType, stringType, widgetStyleType)),
  noMap(createArgSuffixType('get', widgetStyleType, stringType)),
  noMap(createArgSuffixType('has', booleanType, stringType)),
  ...builtIns.map(builtIn => noMap(createSetSuffixType(builtIn, widgetStyleType))),
);
