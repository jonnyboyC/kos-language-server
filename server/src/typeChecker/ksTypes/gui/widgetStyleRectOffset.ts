import { structureType } from '../primitives/structure';
import { createSetSuffixType, createStructureType, noMap } from '../../typeCreators';
import { integerType } from '../primitives/scalar';

export const widgetStyleRectOffsetType = createStructureType('styleRectOffset');
widgetStyleRectOffsetType.addSuper(noMap(structureType));

widgetStyleRectOffsetType.addSuffixes(
  noMap(createSetSuffixType('h', integerType)),
  noMap(createSetSuffixType('v', integerType)),
  noMap(createSetSuffixType('left', integerType)),
  noMap(createSetSuffixType('right', integerType)),
  noMap(createSetSuffixType('top', integerType)),
  noMap(createSetSuffixType('bottom', integerType)),
);
