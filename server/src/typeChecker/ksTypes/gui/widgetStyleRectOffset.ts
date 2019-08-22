import { structureType } from '../primitives/structure';
import { createSetSuffixType, createType, noMap } from '../../typeCreators';
import { integerType } from '../primitives/scalar';

export const widgetStyleRectOffsetType = createType('styleRectOffset');
widgetStyleRectOffsetType.addSuper(noMap(structureType));

widgetStyleRectOffsetType.addSuffixes(
  noMap(createSetSuffixType('h', integerType)),
  noMap(createSetSuffixType('v', integerType)),
  noMap(createSetSuffixType('left', integerType)),
  noMap(createSetSuffixType('right', integerType)),
  noMap(createSetSuffixType('top', integerType)),
  noMap(createSetSuffixType('bottom', integerType)),
);
