import { createType, createSuffixType, noMap } from '../../utilities/typeCreators';
import { structureType } from '../primitives/structure';
import { stringType } from '../primitives/string';
import { integerType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';

export const volumeItemType = createType('volumeitem');
volumeItemType.addSuper(noMap(structureType));

volumeItemType.addSuffixes(
  noMap(createSuffixType('name', stringType)),
  noMap(createSuffixType('size', integerType)),
  noMap(createSuffixType('extension', stringType)),
  noMap(createSuffixType('isfile', booleanType)),
);
