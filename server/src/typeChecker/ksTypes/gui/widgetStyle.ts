import { structureType } from '../primitives/structure';
import {
  createSetSuffixType,
  createSuffixType,
  createType,
  noMap,
} from '../../utilities/typeCreators';
import { rgbaType } from '../rgba';
import { widgetStyleStateType } from './widgetStyleState';
import { scalarType, integerType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';

export const widgetStyleType = createType('widgetStyle');
widgetStyleType.addSuper(noMap(structureType));

widgetStyleType.addSuffixes(
  noMap(createSuffixType('margin', widgetStyleStateType)),
  noMap(createSuffixType('padding', widgetStyleStateType)),
  noMap(createSuffixType('border', widgetStyleStateType)),
  noMap(createSuffixType('overflow', widgetStyleStateType)),
  noMap(createSetSuffixType('width', scalarType)),
  noMap(createSetSuffixType('height', scalarType)),
  noMap(createSetSuffixType('hStretch', booleanType)),
  noMap(createSetSuffixType('vStretch', booleanType)),
  noMap(createSetSuffixType('bg', stringType)),
  noMap(createSetSuffixType('textColor', rgbaType)),
  noMap(createSetSuffixType('wordWrap', booleanType)),
  noMap(createSuffixType('normal', widgetStyleStateType)),
  noMap(createSuffixType('focused', widgetStyleStateType)),
  noMap(createSuffixType('active', widgetStyleStateType)),
  noMap(createSuffixType('hover', widgetStyleStateType)),
  noMap(createSuffixType('on', widgetStyleStateType)),
  noMap(createSuffixType('normal_on', widgetStyleStateType)),
  noMap(createSuffixType('active_on', widgetStyleStateType)),
  noMap(createSuffixType('focused_on', widgetStyleStateType)),
  noMap(createSuffixType('hover_on', widgetStyleStateType)),
  noMap(createSetSuffixType('font', stringType)),
  noMap(createSetSuffixType('fontSize', integerType)),
  noMap(createSetSuffixType('richText', booleanType)),
  noMap(createSetSuffixType('align', stringType)),
);
