import {
  createSuffixType,
  createArgSuffixType,
  createFunctionType,
  noMap,
  createIndexer,
} from './typeCreators';
import { structureType } from './ksTypes/primitives/structure';
import { integerType } from './ksTypes/primitives/scalar';
import { delegateType } from './ksTypes/primitives/delegate';

export const arrayIndexer = createArgSuffixType(
  'list#Indexer',
  structureType,
  integerType,
);

export const delegateCreation = createArgSuffixType(
  'delegate creation',
  delegateType,
);
export const indexerError = createIndexer(structureType, structureType);
export const suffixError = createSuffixType('Unknown suffix', structureType);

export const functionError = createFunctionType(
  'Unknown function',
  structureType,
);

export const defaultSuffix = (name: string) =>
  noMap(createSuffixType(name, structureType));
