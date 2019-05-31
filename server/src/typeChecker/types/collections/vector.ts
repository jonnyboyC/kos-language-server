import { ArgumentType } from '../types';
import { createSetSuffixType, createSuffixType, createStructureType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { scalarType } from '../primitives/scalar';
import { serializableStructureType } from '../primitives/serializeableStructure';

export const vectorType: ArgumentType = createStructureType('vector');
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
