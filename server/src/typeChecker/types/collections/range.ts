import { IArgumentType } from '../types';
import { createArgSuffixType, createStructureType } from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { enumerableType } from './enumerable';
import { scalarType } from '../primitives/scalar';

export const rangeType: IArgumentType = createStructureType('range');
addPrototype(rangeType, enumerableType.toConcreteType(scalarType));

addSuffixes(
  rangeType,
  createArgSuffixType('start', scalarType),
  createArgSuffixType('stop', scalarType),
  createArgSuffixType('step', scalarType),
);
