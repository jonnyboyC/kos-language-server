import {
  createSetSuffixType,
  createType,
  noMap,
} from '../../typeCreators';
import { boxType } from './box';
import { vectorType } from '../collections/vector';
import { booleanType } from '../primitives/boolean';

export const scrollBoxType = createType('scrollBox');
scrollBoxType.addSuper(noMap(boxType));

scrollBoxType.addSuffixes(
  noMap(createSetSuffixType('hAlways', booleanType)),
  noMap(createSetSuffixType('vAlways', booleanType)),
  noMap(createSetSuffixType('position', vectorType)),
);
