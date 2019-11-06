import { widgetType } from './widget';
import {
  noMap,
  createSetSuffixType,
  createArgSuffixType,
  createSuffixType,
} from '../../utilities/typeCreators';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';
import { noneType } from '../primitives/none';
import { widgetStyleType } from './widgetStyle';
import { guiWidgetType } from './guiWidget';
import { boxType } from './box';
import { labelType } from './elements/label';
import { stringType } from '../primitives/string';
import { textFieldType } from './elements/textField';
import { buttonType } from './elements/button';
import { popupMenuType } from './elements/popupMenu';
import { sliderType } from './elements/slider';
import { doubleType, integerType, scalarType } from '../primitives/scalar';
import { scrollBoxType } from './scrollBox';
import { spacingType } from './spacing';
import { listType } from '../collections/list';
import { userDelegateType } from '../userDelegate';
import { widgetSkinType } from './widgetSkin';

let set = false;

export const guiInitializer = () => {
  if (set) {
    return;
  }
  set = true;

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

  boxType.addSuper(noMap(widgetType));

  boxType.addSuffixes(
    noMap(createArgSuffixType('addLabel', labelType, stringType)),
    noMap(createArgSuffixType('addTextField', textFieldType, stringType)),
    noMap(createArgSuffixType('addButton', buttonType, stringType)),
    noMap(
      createArgSuffixType(
        'addRadioButton',
        buttonType,
        stringType,
        booleanType,
      ),
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
    noMap(createSuffixType('widgets', listType.apply(widgetType))),
    noMap(createSuffixType('radioValue', stringType)),
    noMap(createSetSuffixType('onRadioChange', userDelegateType)),
    noMap(createArgSuffixType('showOnly', noneType, widgetType)),
    noMap(createArgSuffixType('clear', noneType)),
  );

  guiWidgetType.addSuper(noMap(boxType));

  guiWidgetType.addSuffixes(
    noMap(createSetSuffixType('x', scalarType)),
    noMap(createSetSuffixType('y', scalarType)),
    noMap(createSetSuffixType('draggable', booleanType)),
    noMap(createSetSuffixType('extraDelay', scalarType)),
    noMap(createSetSuffixType('skin', widgetSkinType)),
  );
};
