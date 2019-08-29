import {
  createSuffixType,
  createArgSuffixType,
  createFunctionType,
  noMap,
  createIndexer,
} from './utilities/typeCreators';
import { structureType } from './ksTypes/primitives/structure';
import { integerType } from './ksTypes/primitives/scalar';
import { IType } from './types';
import { DelegateType } from './types/delegateType';

export const arrayIndexer = createArgSuffixType(
  'list#Indexer',
  structureType,
  integerType,
);

export const delegateCreation = (type: IType) => {
  return createArgSuffixType('delegate creation', new DelegateType(type));
};

export const indexerError = createIndexer(structureType, structureType);
export const suffixError = createSuffixType('Unknown suffix', structureType);

export const functionError = createFunctionType(
  'Unknown function',
  structureType,
);

export const defaultSuffix = (name: string) =>
  noMap(createSuffixType(name, structureType));
