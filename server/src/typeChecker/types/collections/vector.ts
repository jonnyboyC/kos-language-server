import { IArgumentType } from '../types';
import {
  createSetSuffixType, createSuffixType, createStructureType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { scalarType } from '../primitives/primitives';
import { serializableStructureType } from '../primitives/structure';

export const vectorType: IArgumentType = createStructureType('vector');

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
