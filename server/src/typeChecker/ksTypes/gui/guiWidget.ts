import {
  createSetSuffixType,
  createType,
  noMap,
} from '../../utilities/typeCreators';
import { boxType } from './box';
import { widgetSkinType } from './widgetSkin';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';

export const guiWidgetType = createType('gui');
guiWidgetType.addSuper(noMap(boxType));

guiWidgetType.addSuffixes(
  noMap(createSetSuffixType('x', scalarType)),
  noMap(createSetSuffixType('y', scalarType)),
  noMap(createSetSuffixType('draggable', booleanType)),
  noMap(createSetSuffixType('extraDelay', scalarType)),
  noMap(createSetSuffixType('skin', widgetSkinType)),
);
