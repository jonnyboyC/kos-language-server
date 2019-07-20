import { ArgumentType } from '../types';
import { createStructureType, createSuffixType } from '../../typeCreators';
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { structureType } from '../primitives/structure';
import { stringType } from '../primitives/string';
import { scalarType } from '../primitives/scalar';
import { listType } from '../collections/list';
import { partType } from './part';

export const aggregateResourceType: ArgumentType = createStructureType('aggregateResource');
addPrototype(aggregateResourceType, structureType);

addSuffixes(
  aggregateResourceType,
  createSuffixType('name', stringType),
  createSuffixType('density', scalarType),
  createSuffixType('amount', scalarType),
  createSuffixType('capacity', scalarType),
  createSuffixType('parts', listType.toConcreteType(partType)),
);
