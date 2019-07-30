import { createSetSuffixType, createStructureType } from '../../typeCreators';
import { boxType } from './box';
import { vectorType } from '../collections/vector';
import { booleanType } from '../primitives/boolean';

export const scrollBoxType = createStructureType('scrollBox');
scrollBoxType.addSuper(boxType);

scrollBoxType.addSuffixes(
  createSetSuffixType('hAlways', booleanType),
  createSetSuffixType('vAlways', booleanType),
  createSetSuffixType('position', vectorType),
);
