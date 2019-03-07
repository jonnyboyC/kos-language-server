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
import { booleanType } from '../primitives/boolean';
import { doubleType, integarType } from '../primitives/scalar';

export const boxType: IArgumentType = createStructureType('box');
addPrototype(boxType, widgetType);

addSuffixes(
  boxType,
  createArgSuffixType('addLabel', labelType, stringType),
  createArgSuffixType('addTextField', textFieldType, stringType),
  createArgSuffixType('addButton', buttonType, stringType),
  createArgSuffixType('addRadioButton', buttonType, stringType, booleanType),
  createArgSuffixType('addCheckBox', buttonType, stringType, booleanType),
  createArgSuffixType('addPopUpMenu', popupMenuType, stringType),
  createArgSuffixType('addHSlider', sliderType, stringType, doubleType, doubleType, doubleType),
  createArgSuffixType('addVSlider', sliderType, stringType, doubleType, doubleType, doubleType),
  createSuffixType('addHBox', boxType),
  createSuffixType('addVBox', boxType),
  createSuffixType('addHLayout', boxType),
  createSuffixType('addVLayout', boxType),
  createSuffixType('addScrollBox', scrollBoxType),
  createSuffixType('addStack', scrollBoxType),
  createArgSuffixType('addSpacing', spacingType, integarType),
  createSuffixType('widgets', userListType),
  createSuffixType('radioValue', stringType),
  createSetSuffixType('onRadioChange', userDelegateType),
  createArgSuffixType('showOnly', voidType, widgetType),
  createArgSuffixType('clear', voidType),
);
