import {
  createStructureType,
  createSuffixType,
  createSetSuffixType,
} from '../typeCreators';
import { structureType } from './primitives/structure';
import { scalarType } from './primitives/scalar';
import { stringType } from './primitives/string';
import { booleanType } from './primitives/boolean';

export const resourceTransferType = createStructureType('transfer');
resourceTransferType.addSuper(structureType);

resourceTransferType.addSuffixes(
  createSuffixType('goal', scalarType),
  createSuffixType('transferred', scalarType),
  createSuffixType('status', stringType),
  createSuffixType('message', stringType),
  createSuffixType('resource', stringType),
  createSetSuffixType('active', booleanType),
);
