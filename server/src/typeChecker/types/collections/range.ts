import { ArgumentType } from '../types';
import { createArgSuffixType, createStructureType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { enumerableType } from './enumerable';
import { scalarType } from '../primitives/scalar';

export const rangeType: ArgumentType = createStructureType('range');
addPrototype(rangeType, enumerableType.toConcreteType(scalarType));

addSuffixes(
  rangeType,
  createArgSuffixType('start', scalarType),
  createArgSuffixType('stop', scalarType),
  createArgSuffixType('step', scalarType),
);
