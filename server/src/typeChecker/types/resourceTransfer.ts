import { ArgumentType } from './types';
import { createStructureType, createSuffixType, createSetSuffixType } from "../typeCreators";
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from './primitives/structure';
import { scalarType } from './primitives/scalar';
import { stringType } from './primitives/string';
import { booleanType } from './primitives/boolean';

export const resourceTransferType: ArgumentType = createStructureType('transfer');
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
