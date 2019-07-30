import {
  createStructureType,
  createSuffixType,
  createSetSuffixType,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { stringType } from '../primitives/string';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';

export const resourceType = createStructureType('resource');
resourceType.addSuper(structureType);

resourceType.addSuffixes(
  createSuffixType('name', stringType),
  createSuffixType('amount', scalarType),
  createSuffixType('density', scalarType),
  createSuffixType('capacity', scalarType),
  createSuffixType('toggleable', booleanType),
  createSetSuffixType('enabled', booleanType),
);
