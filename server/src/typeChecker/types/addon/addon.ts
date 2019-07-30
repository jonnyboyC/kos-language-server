import { ArgumentType } from '../types';
import { createStructureType, createSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';

export const addonType = createStructureType('addon');
addonType.addSuper(structureType);

addonType.add
addonType.addSuffixes(
  createSuffixType('available', booleanType),
);
