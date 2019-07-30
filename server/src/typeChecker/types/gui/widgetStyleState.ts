import { structureType } from '../primitives/structure';
import { createSetSuffixType, createStructureType } from '../../typeCreators';
import { rgbaType } from '../rgba';
import { stringType } from '../primitives/string';

export const widgetStyleStateType = createStructureType('styleState');
widgetStyleStateType.addSuper(structureType);

widgetStyleStateType.addSuffixes(
  createSetSuffixType('bg', stringType),
  createSetSuffixType('textColor', rgbaType),
);
