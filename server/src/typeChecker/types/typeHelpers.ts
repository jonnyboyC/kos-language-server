import { IArgumentType } from './types';
import { createStructureType, createSuffixType, createArgSuffixType } from './ksType';
import { addPrototype } from '../typeUitlities';
import { serializableStructureType, structureType } from './primitives/structure';
import { integarType } from './primitives/scalar';
import { delegateType } from './primitives/delegate';

export const timeWarpType: IArgumentType = createStructureType('timeWarp');
addPrototype(timeWarpType, serializableStructureType);

export const arrayIndexer =
  createArgSuffixType('array#Indexer', structureType, integarType);
export const arrayBracketIndexer =
  createArgSuffixType('array[Indexer]', structureType, integarType); // TODO union
export const delegateCreation =
  createArgSuffixType('delegateCreation', delegateType, integarType); // TODO union
export const suffixError =
  createSuffixType('suffix Error', structureType);
