import { ArgumentType } from '../types';
import { structureType } from '../primitives/structure';
import { createSetSuffixType, createStructureType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { rgbaType } from '../rgba';
import { stringType } from '../primitives/string';

export const widgetStyleStateType: ArgumentType = createStructureType('styleState');
addPrototype(widgetStyleStateType, structureType);

addSuffixes(
  widgetStyleStateType,
  createSetSuffixType('bg', stringType),
  createSetSuffixType('textColor', rgbaType),
);
