import { ArgumentType } from '../types';
import { createArgSuffixType, createStructureType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { enumerableType } from './enumerable';
import { scalarType } from '../primitives/scalar';

export const rangeType = createStructureType('range');
rangeType.addSuper(enumerableType.toConcreteType(scalarType));

rangeType.addSuffixes(
  createArgSuffixType('start', scalarType),
  createArgSuffixType('stop', scalarType),
  createArgSuffixType('step', scalarType),
);
