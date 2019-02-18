import { IArgumentType } from '../types';
import {
  createSetSuffixType, createSuffixType,
  createArgSuffixType, createStructureType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { widgetType } from './widget';
import { userDelegateType } from '../userDelegate';
import { scrollBoxType } from './scrollBox';
import { spacingType } from './spacing';
import { labelType } from './elements/label';
import { textFieldType } from './elements/textField';
import { buttonType } from './elements/button';
import { popupMenuType } from './elements/popupMenu';
import { sliderType } from './elements/slider';
import { voidType } from '../primitives/void';
import { userListType } from '../collections/userList';
import { stringType } from '../primitives/string';

export const boxType: IArgumentType = createStructureType('box');
addPrototype(boxType, widgetType);

addSuffixes(
  boxType,
  createArgSuffixType('addLabel', voidType, labelType),
  createArgSuffixType('addTextField', voidType, textFieldType),
  createArgSuffixType('addButton', voidType, buttonType),
  createArgSuffixType('addRadioButton', voidType, buttonType),
  createArgSuffixType('addCheckBox', voidType, buttonType),
  createArgSuffixType('addPopUpMenu', voidType, popupMenuType),
  createArgSuffixType('addHSlider', voidType, sliderType),
  createArgSuffixType('addVSlider', voidType, sliderType),
  createSuffixType('addHBox', boxType),
  createSuffixType('addVBox', boxType),
  createSuffixType('addHLayout', boxType),
  createSuffixType('addVLayout', boxType),
  createSuffixType('addScrollBox', scrollBoxType),
  createSuffixType('addStack', scrollBoxType),
  createArgSuffixType('addSpacing', voidType, spacingType),
  createSuffixType('widgets', userListType),
  createSuffixType('radioValue', stringType),
  createSetSuffixType('onRadioChange', userDelegateType),
  createArgSuffixType('showOnly', widgetType),
  createArgSuffixType('clear', voidType),
);
