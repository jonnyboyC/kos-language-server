import { structureType } from '../primitives/structure';
import { createSetSuffixType, createStructureType } from '../../typeCreators';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { integerType } from '../primitives/scalar';
import { ArgumentType } from '../types';

export const widgetStyleRectOffsetType: ArgumentType = createStructureType(
  'styleRectOffset',
);
addPrototype(widgetStyleRectOffsetType, structureType);

addSuffixes(
  widgetStyleRectOffsetType,
  createSetSuffixType('h', integerType),
  createSetSuffixType('v', integerType),
  createSetSuffixType('left', integerType),
  createSetSuffixType('right', integerType),
  createSetSuffixType('top', integerType),
  createSetSuffixType('bottom', integerType),
);
