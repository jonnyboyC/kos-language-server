import {
  createSetSuffixType,
  createSuffixType,
  createArgSuffixType,
  createStructureType,
  noMap,
} from '../../typeCreators';
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
import { stringType } from '../primitives/string';
import { booleanType } from '../primitives/boolean';
import { doubleType, integerType } from '../primitives/scalar';
import { listType } from '../collections/list';

export const boxType = createStructureType('box');
boxType.addSuper(noMap(widgetType));

boxType.addSuffixes(
  noMap(createArgSuffixType('addLabel', labelType, stringType)),
  noMap(createArgSuffixType('addTextField', textFieldType, stringType)),
  noMap(createArgSuffixType('addButton', buttonType, stringType)),
  noMap(
    createArgSuffixType('addRadioButton', buttonType, stringType, booleanType),
  ),
  noMap(
    createArgSuffixType('addCheckBox', buttonType, stringType, booleanType),
  ),
  noMap(createArgSuffixType('addPopUpMenu', popupMenuType, stringType)),
  noMap(
    createArgSuffixType(
      'addHSlider',
      sliderType,
      stringType,
      doubleType,
      doubleType,
      doubleType,
    ),
  ),
  noMap(
    createArgSuffixType(
      'addVSlider',
      sliderType,
      stringType,
      doubleType,
      doubleType,
      doubleType,
    ),
  ),
  noMap(createSuffixType('addHBox', boxType)),
  noMap(createSuffixType('addVBox', boxType)),
  noMap(createSuffixType('addHLayout', boxType)),
  noMap(createSuffixType('addVLayout', boxType)),
  noMap(createSuffixType('addScrollBox', scrollBoxType)),
  noMap(createSuffixType('addStack', scrollBoxType)),
  noMap(createArgSuffixType('addSpacing', spacingType, integerType)),
  noMap(createSuffixType('widgets', listType.toConcrete(widgetType))),
  noMap(createSuffixType('radioValue', stringType)),
  noMap(createSetSuffixType('onRadioChange', userDelegateType)),
  noMap(createArgSuffixType('showOnly', voidType, widgetType)),
  noMap(createArgSuffixType('clear', voidType)),
);
