import { IArgumentType } from './types';
import { createStructureType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './primitives/structure';
import { stringType, scalarType } from './primitives/primitives';
import { userListType } from './collections/list';

export const aggregateResourceType: IArgumentType = createStructureType('aggregateResource');
addPrototype(aggregateResourceType, structureType);

addSuffixes(
  aggregateResourceType,
  createSuffixType('name', stringType),
  createSuffixType('density', scalarType),
  createSuffixType('amount', scalarType),
  createSuffixType('capacity', scalarType),
  createSuffixType('part', userListType),
);
