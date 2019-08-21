import {
  createType,
  createSuffixType,
  createSetSuffixType,
  noMap,
} from '../typeCreators';
import { structureType } from './primitives/structure';
import { scalarType } from './primitives/scalar';
import { stringType } from './primitives/string';
import { booleanType } from './primitives/boolean';

export const resourceTransferType = createType('transfer');
resourceTransferType.addSuper(noMap(structureType));

resourceTransferType.addSuffixes(
  noMap(createSuffixType('goal', scalarType)),
  noMap(createSuffixType('transferred', scalarType)),
  noMap(createSuffixType('status', stringType)),
  noMap(createSuffixType('message', stringType)),
  noMap(createSuffixType('resource', stringType)),
  noMap(createSetSuffixType('active', booleanType)),
);
