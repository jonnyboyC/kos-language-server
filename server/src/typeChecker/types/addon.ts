import { IArgumentType } from './types';
import { createStructureType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from './primitives/structure';
import { booleanType } from './primitives/boolean';

export const addonType: IArgumentType = createStructureType('addon');
addPrototype(addonType, structureType);

addSuffixes(
  addonType,
  createSuffixType('available', booleanType),
);
