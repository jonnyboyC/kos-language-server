import { IType } from '../types';
import {
  createSetSuffixType, createStructureType,
} from '../ksType';
import { booleanType, scalarType } from '../primitives';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { boxType } from './box';
import { widgetSkinType } from './widgetSkin';

export const guiWidgetType: IType = createStructureType('gui');
addPrototype(guiWidgetType, boxType);

addSuffixes(
  guiWidgetType,
  createSetSuffixType('x', scalarType),
  createSetSuffixType('y', scalarType),
  createSetSuffixType('draggable', booleanType),
  createSetSuffixType('extraDelay', scalarType),
  createSetSuffixType('skin', widgetSkinType),
);
