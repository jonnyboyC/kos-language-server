import { IType } from './types';
import { createStructureType, createArgSuffixType } from './ksType';
import { addSuffixes, addPrototype } from './typeUitlities';
import { stringType, booleanType } from './primitives';

export const structureType: IType = createStructureType('structure');
export const serializableStructureType: IType = createStructureType('serializableStructure');
addPrototype(serializableStructureType, structureType);

addSuffixes(
  structureType,
  createArgSuffixType('tostring', stringType),
  createArgSuffixType('hassuffix', booleanType, stringType),
  createArgSuffixType('suffixnames', undefined),
  createArgSuffixType('isserializable', booleanType),
  createArgSuffixType('typename', stringType),
  createArgSuffixType('istype', booleanType, stringType),
  createArgSuffixType('inheritance', stringType),
);
