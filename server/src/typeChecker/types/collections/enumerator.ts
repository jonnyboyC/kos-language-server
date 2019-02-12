import { IArgumentType } from '../types';
import { createStructureType, createArgSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from '../primitives/structure';
import { scalarType, booleanType } from '../primitives/primitives';

export const enumeratorType: IArgumentType = createStructureType('enumerator');
addPrototype(enumeratorType, structureType);

addSuffixes(
  enumeratorType,
  createArgSuffixType('next', booleanType),
  createArgSuffixType('atend', booleanType),
  createArgSuffixType('index', scalarType),
  createArgSuffixType('value', structureType),
);
