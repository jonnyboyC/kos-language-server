import { IType } from '../types';
import { createArgSuffixType, createStructureType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { enumeratorType } from './enumerator';
import { scalarType } from '../primitives';

export const rangeType: IType = createStructureType('range');
addPrototype(rangeType, enumeratorType.toConcreteType(scalarType));

addSuffixes(
  rangeType,
  createArgSuffixType('start', scalarType),
  createArgSuffixType('stop', scalarType),
  createArgSuffixType('step', scalarType),
);
