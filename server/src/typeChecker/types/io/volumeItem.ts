import { IArgumentType } from '../types';
import { createStructureType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from '../primitives/structure';
import { stringType } from '../primitives/string';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';

export const volumeItemType: IArgumentType = createStructureType('volumeitem');
addPrototype(volumeItemType, structureType);

addSuffixes(
  volumeItemType,
  createSuffixType('name', stringType),
  createSuffixType('size', scalarType),
  createSuffixType('extension', stringType),
  createSuffixType('isfile', booleanType),
);
