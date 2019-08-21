import { structureType } from '../primitives/structure';
import { createSetSuffixType, createType, noMap } from '../../typeCreators';
import { rgbaType } from '../rgba';
import { stringType } from '../primitives/string';

export const widgetStyleStateType = createType('styleState');
widgetStyleStateType.addSuper(noMap(structureType));

widgetStyleStateType.addSuffixes(
  noMap(createSetSuffixType('bg', stringType)),
  noMap(createSetSuffixType('textColor', rgbaType)),
);
