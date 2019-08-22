import {
  createType,
  createSuffixType,
  createSetSuffixType,
  noMap,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { stringType } from '../primitives/string';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';

export const resourceType = createType('resource');
resourceType.addSuper(noMap(structureType));

resourceType.addSuffixes(
  noMap(createSuffixType('name', stringType)),
  noMap(createSuffixType('amount', scalarType)),
  noMap(createSuffixType('density', scalarType)),
  noMap(createSuffixType('capacity', scalarType)),
  noMap(createSuffixType('toggleable', booleanType)),
  noMap(createSetSuffixType('enabled', booleanType)),
);
