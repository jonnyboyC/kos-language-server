import { IArgumentType } from './types';
import { createStructureType, createSuffixType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './primitives/structure';
import { booleanType, scalarType, stringType } from './primitives/primitives';

export const resourceTransferType: IArgumentType = createStructureType('transfer');
addPrototype(resourceTransferType, structureType);

addSuffixes(
  resourceTransferType,
  createSuffixType('goal', scalarType),
  createSuffixType('transferred', scalarType),
  createSuffixType('status', stringType),
  createSuffixType('message', stringType),
  createSuffixType('resource', stringType),
  createSetSuffixType('active', booleanType),
);
