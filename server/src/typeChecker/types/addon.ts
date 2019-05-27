import { ArgumentType } from './types';
import { createStructureType, createSuffixType } from "../typeCreators";
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from './primitives/structure';
import { booleanType } from './primitives/boolean';

export const addonType: ArgumentType = createStructureType('addon');
addPrototype(addonType, structureType);

addSuffixes(
  addonType,
  createSuffixType('available', booleanType),
);
