import { createStructureType, createSuffixType } from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { stringType } from '../primitives/string';
import { scalarType } from '../primitives/scalar';
import { listType } from '../collections/list';
import { partType } from './part';

export const aggregateResourceType = createStructureType('aggregateResource');
aggregateResourceType.addSuper(structureType);

aggregateResourceType.addSuffixes(
  createSuffixType('name', stringType),
  createSuffixType('density', scalarType),
  createSuffixType('amount', scalarType),
  createSuffixType('capacity', scalarType),
  createSuffixType('parts', listType.toConcreteType(partType)),
);
