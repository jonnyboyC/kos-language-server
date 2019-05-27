import { ArgumentType } from './types';
import { createStructureType, createSuffixType } from "../typeCreators";
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from './primitives/structure';
import { booleanType } from './primitives/boolean';

export const addonListType: ArgumentType = createStructureType('addonList');
addPrototype(addonListType, structureType);

addSuffixes(
  addonListType,
  /* TODO this type can have runtime addons with string -> addon maps */
  createSuffixType('available', booleanType),
  createSuffixType('hasAddon', booleanType),
);
