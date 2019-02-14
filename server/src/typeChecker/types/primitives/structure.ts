import { createStructureType, createArgSuffixType } from '../ksType';
import { addSuffixes, addPrototype } from '../typeUitlities';
import { voidType } from './void';
import { stringType } from './string';
import { booleanType } from './boolean';

export const structureType = createStructureType('structure');
export const serializableStructureType = createStructureType('serializableStructure');
addPrototype(serializableStructureType, structureType);

addSuffixes(
  structureType,
  createArgSuffixType('tostring', stringType),
  createArgSuffixType('hassuffix', booleanType, stringType),
  createArgSuffixType('suffixnames', voidType),
  createArgSuffixType('isserializable', booleanType),
  createArgSuffixType('typename', stringType),
  createArgSuffixType('istype', booleanType, stringType),
  createArgSuffixType('inheritance', stringType),
);
