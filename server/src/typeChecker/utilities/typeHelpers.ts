import {
  createSuffixType,
  createArgSuffixType,
  createFunctionType,
  noMap,
  createIndexer,
} from './typeCreators';
import { structureType } from '../ksTypes/primitives/structure';
import { integerType } from '../ksTypes/primitives/scalar';
import { IType, TypeKind } from '../types';
import { DelegateType } from '../models/types/delegateType';

export const arrayIndexer = createArgSuffixType(
  'list#Indexer',
  structureType,
  integerType,
);

export const delegateError = createFunctionType(
  'Unknown function',
  structureType,
);

export const delegateCreation = (type: IType) => {
  const delegate = type.kind === TypeKind.function ? type : delegateError;

  return createArgSuffixType('delegate creation', new DelegateType(delegate));
};

export const indexerError = createIndexer(structureType, structureType);
export const callableError = createSuffixType('Unknown callable', structureType);
export const suffixError = createSuffixType('Unknown suffix', structureType);

export const functionError = createFunctionType(
  'Unknown function',
  structureType,
);

export const defaultSuffix = (name: string) =>
  noMap(createSuffixType(name, structureType));
