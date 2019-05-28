import { createSuffixType, createArgSuffixType } from './typeCreators';
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
) => {
  const typeString = `${collectionType.toTypeString()}[${indexType.toTypeString()}]`;

  const hit = arrayBracketCache.get(typeString);
  if (!empty(hit)) {
    return hit;
  }

  const type = createArgSuffixType(
    typeString,
    structureType,
    indexType,
  );

  arrayBracketCache.set(typeString, type);
  return type;
};

export const delegateCreation = createArgSuffixType(
  'delegate creation',
  delegateType,
);
export const suffixError = createSuffixType('Invalid suffix', structureType);

export const defaultSuffix = (name: string) =>
  createSuffixType(name, structureType);
