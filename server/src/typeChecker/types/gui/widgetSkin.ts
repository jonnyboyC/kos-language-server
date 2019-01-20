import { IType } from '../types';
import {
  createSetSuffixType, createStructureType, createArgSuffixType,
} from '../ksType';
import { booleanType, stringType } from '../primitives';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from '../structure';
import { rgbaType } from '../rgba';
import { widgetStyleType } from './widgetStyle';

export const widgetSkinType: IType = createStructureType('skin');
addPrototype(widgetSkinType, structureType);

const builtIns = [
  'box', 'button',
  'horizontalScrollbar', 'horizontalScrollbarLeftButton',
  'horizontalScrollbarRightButton', 'horizontalScrollbarThumb',
  'horizontalSlider', 'horizontalSliderThumb',
  'verticalScrollbar', 'verticalScrollbarLeftButton',
  'verticalScrollbarRightButton', 'verticalScrollbarThumb',
  'verticalSlider', 'verticalSliderThumb',
  'label', 'scrollView', 'textArea', 'textField', 'toggle', 'window',
];

addSuffixes(
  widgetSkinType,
  createSetSuffixType('font', stringType),
  createSetSuffixType('selectionColor', rgbaType),
  createArgSuffixType('add', widgetStyleType, stringType, widgetStyleType),
  createArgSuffixType('get', widgetStyleType, stringType),
  createArgSuffixType('has', booleanType, stringType),
  ...builtIns.map(builtIn => createSetSuffixType(builtIn, widgetStyleType)),
);
