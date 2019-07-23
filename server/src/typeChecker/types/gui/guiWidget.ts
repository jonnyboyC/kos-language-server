import { ArgumentType } from '../types';
import { createSetSuffixType, createStructureType } from '../../typeCreators';
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { boxType } from './box';
import { widgetSkinType } from './widgetSkin';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';

export const guiWidgetType: ArgumentType = createStructureType('gui');
addPrototype(guiWidgetType, boxType);

addSuffixes(
  guiWidgetType,
  createSetSuffixType('x', scalarType),
  createSetSuffixType('y', scalarType),
  createSetSuffixType('draggable', booleanType),
  createSetSuffixType('extraDelay', scalarType),
  createSetSuffixType('skin', widgetSkinType),
);
