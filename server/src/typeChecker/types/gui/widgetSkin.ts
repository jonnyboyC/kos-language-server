import {
  createSetSuffixType,
  createStructureType,
  createArgSuffixType,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { rgbaType } from '../rgba';
import { widgetStyleType } from './widgetStyle';
import { stringType } from '../primitives/string';
import { booleanType } from '../primitives/boolean';

export const widgetSkinType = createStructureType('skin');
widgetSkinType.addSuper(structureType);

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
  createSetSuffixType('font', stringType),
  createSetSuffixType('selectionColor', rgbaType),
  createArgSuffixType('add', widgetStyleType, stringType, widgetStyleType),
  createArgSuffixType('get', widgetStyleType, stringType),
  createArgSuffixType('has', booleanType, stringType),
  ...builtIns.map(builtIn => createSetSuffixType(builtIn, widgetStyleType)),
);
