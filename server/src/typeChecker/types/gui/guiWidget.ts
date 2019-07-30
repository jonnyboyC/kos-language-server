import { createSetSuffixType, createStructureType } from '../../typeCreators';
import { boxType } from './box';
import { widgetSkinType } from './widgetSkin';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';

export const guiWidgetType = createStructureType('gui');
guiWidgetType.addSuper(boxType);

guiWidgetType.addSuffixes(
  createSetSuffixType('x', scalarType),
  createSetSuffixType('y', scalarType),
  createSetSuffixType('draggable', booleanType),
  createSetSuffixType('extraDelay', scalarType),
  createSetSuffixType('skin', widgetSkinType),
);
