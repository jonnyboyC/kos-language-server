import { structureType } from '../primitives/structure';
import { createSetSuffixType, createStructureType } from '../../typeCreators';
import { integerType } from '../primitives/scalar';

export const widgetStyleRectOffsetType = createStructureType('styleRectOffset');
widgetStyleRectOffsetType.addSuper(structureType);

widgetStyleRectOffsetType.addSuffixes(
  createSetSuffixType('h', integerType),
  createSetSuffixType('v', integerType),
  createSetSuffixType('left', integerType),
  createSetSuffixType('right', integerType),
  createSetSuffixType('top', integerType),
  createSetSuffixType('bottom', integerType),
);
