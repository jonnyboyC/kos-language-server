import { ArgumentType } from '../types';
import { createStructureType, createSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { structureType } from '../primitives/structure';
import { stringType } from '../primitives/string';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';

export const volumeItemType: ArgumentType = createStructureType('volumeitem');
addPrototype(volumeItemType, structureType);

addSuffixes(
  volumeItemType,
  createSuffixType('name', stringType),
  createSuffixType('size', scalarType),
  createSuffixType('extension', stringType),
  createSuffixType('isfile', booleanType),
);
