import { createSuffixType, createArgSuffixType, createFunctionType } from './typeCreators';
import { structureType } from './types/primitives/structure';
import { integarType } from './types/primitives/scalar';
import { delegateType } from './types/primitives/delegate';
import { ISuffixType, IBasicType } from './types/types';
import { empty } from '../utilities/typeGuards';

const arrayBracketCache: Map<string, ISuffixType> = new Map();

export const arrayIndexer = createArgSuffixType(
  'list#Indexer',
  structureType,
  integarType,
);

export const arrayBracketIndexer = (
  collectionType: IBasicType,
  indexType: IBasicType,
  returnType: IBasicType,
) => {
  const typeString = `${collectionType.toTypeString()}[${indexType.toTypeString()}]`;

  const hit = arrayBracketCache.get(typeString);
  if (!empty(hit)) {
    return hit;
  }

  const type = createSuffixType(
    typeString,
    returnType,
  );

  arrayBracketCache.set(typeString, type);
  return type;
};

export const delegateCreation = createArgSuffixType(
  'delegate creation',
  delegateType,
);
export const suffixError = createSuffixType('Unknown suffix', structureType);

export const functionError = createFunctionType('Unknown function', structureType);

export const defaultSuffix = (name: string) =>
  createSuffixType(name, structureType);
