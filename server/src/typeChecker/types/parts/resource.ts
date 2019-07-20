import { ArgumentType } from '../types';
import { createStructureType, createSuffixType, createSetSuffixType } from '../../typeCreators';
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { structureType } from '../primitives/structure';
import { stringType } from '../primitives/string';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';

export const resourceType: ArgumentType = createStructureType('resource');
addPrototype(resourceType, structureType);

addSuffixes(
  resourceType,
  createSuffixType('name', stringType),
  createSuffixType('amount', scalarType),
  createSuffixType('density', scalarType),
  createSuffixType('capacity', scalarType),
  createSuffixType('toggleable', booleanType),
  createSetSuffixType('enabled', booleanType),
);
