import { IType } from './types';
import { createStructureType, createSuffixType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { booleanType, scalarType, stringType } from './primitives';

export const resourceTransferType: IType = createStructureType('transfer');
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
