import { createSuffixType, createArgSuffixType } from "./typeCreators";
import { structureType } from './types/primitives/structure';
import { integarType } from './types/primitives/scalar';
import { delegateType } from './types/primitives/delegate';

export const arrayIndexer =
  createArgSuffixType('array#Indexer', structureType, integarType);
export const arrayBracketIndexer =
  createArgSuffixType('array[Indexer]', structureType, integarType); // TODO union
export const delegateCreation =
  createArgSuffixType('delegateCreation', delegateType, integarType); // TODO union
export const suffixError =
  createSuffixType('Invalid suffix', structureType);

export const defaultSuffix = (name: string) => createSuffixType(name, structureType);
