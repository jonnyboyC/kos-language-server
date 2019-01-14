import { IType } from '../types';
import { createStructureType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from '../structure';
import { booleanType, stringType, scalarType } from '../primitives';

export const volumeItemType: IType = createStructureType('volumeitem');
addPrototype(volumeItemType, structureType);

addSuffixes(
  volumeItemType,
  createSuffixType('name', stringType),
  createSuffixType('size', scalarType),
  createSuffixType('extension', stringType),
  createSuffixType('isfile', booleanType),
);
