import { ArgumentType } from '../types';
import { createStructureType, createArgSuffixType } from '../../typeCreators';
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';

export const addonListType: ArgumentType = createStructureType('addonList');
addPrototype(addonListType, structureType);

addSuffixes(
  addonListType,
  /* TODO this type can have runtime addons with string -> addon maps */
  createArgSuffixType('available', booleanType, stringType),
  createArgSuffixType('hasAddon', booleanType, stringType),
);
