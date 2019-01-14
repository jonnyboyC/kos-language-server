import { IType } from '../types';
import {
  createSetSuffixType, createSuffixType, createStructureType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { scalarType } from '../primitives';
import { serializableStructureType } from '../structure';

export const vectorType: IType = createStructureType('vector');

addPrototype(vectorType, serializableStructureType);

addSuffixes(
  vectorType,
  createSetSuffixType('x', scalarType),
  createSetSuffixType('y', scalarType),
  createSetSuffixType('z', scalarType),
  createSetSuffixType('mag', scalarType),
  createSuffixType('vec', vectorType),
  createSuffixType('normalized', vectorType),
  createSuffixType('sqrMagnitude', scalarType),
  createSetSuffixType('direction', scalarType),
);
