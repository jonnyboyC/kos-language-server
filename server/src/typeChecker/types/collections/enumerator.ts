import { IType } from '../types';
import { createStructureType, createArgSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from '../structure';
import { scalarType, booleanType } from '../primitives';

export const enumeratorType: IType = createStructureType('enumerator');
addPrototype(enumeratorType, structureType);

addSuffixes(
  enumeratorType,
  createArgSuffixType('next', booleanType),
  createArgSuffixType('atend', booleanType),
  createArgSuffixType('index', scalarType),
  createArgSuffixType('value', structureType),
);
