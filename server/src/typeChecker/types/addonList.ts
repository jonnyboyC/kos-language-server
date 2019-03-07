import { IArgumentType } from './types';
import { createStructureType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from './primitives/structure';
import { booleanType } from './primitives/boolean';

export const addonListType: IArgumentType = createStructureType('addonList');
addPrototype(addonListType, structureType);

addSuffixes(
  addonListType,
  /* TODO this type can have runtime addons with string -> addon maps */
  createSuffixType('available', booleanType),
  createSuffixType('hasAddon', booleanType),
);
