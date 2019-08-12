import {
  createSetSuffixType,
  createStructureType,
  noMap,
} from '../../typeCreators';
import { boxType } from './box';
import { vectorType } from '../collections/vector';
import { booleanType } from '../primitives/boolean';

export const scrollBoxType = createStructureType('scrollBox');
scrollBoxType.addSuper(noMap(boxType));

scrollBoxType.addSuffixes(
  noMap(createSetSuffixType('hAlways', booleanType)),
  noMap(createSetSuffixType('vAlways', booleanType)),
  noMap(createSetSuffixType('position', vectorType)),
);
