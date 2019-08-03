import {
  createSetSuffixType,
  createSuffixType,
  createStructureType,
} from '../../typeCreators';
import { scalarType } from '../primitives/scalar';
import { serializableStructureType } from '../primitives/serializeableStructure';
import { OperatorKind } from '../../types';
import { booleanType } from '../primitives/boolean';
import { Operator } from '../../operator';

export const vectorType = createStructureType('vector');
vectorType.addSuper(serializableStructureType);

vectorType.addSuffixes(
  createSetSuffixType('x', scalarType),
  createSetSuffixType('y', scalarType),
  createSetSuffixType('z', scalarType),
  createSetSuffixType('mag', scalarType),
  createSuffixType('vec', vectorType),
  createSuffixType('normalized', vectorType),
  createSuffixType('sqrMagnitude', scalarType),
  createSetSuffixType('direction', scalarType),
);

vectorType.addOperators(
  new Operator(OperatorKind.plus, vectorType, vectorType),
  new Operator(OperatorKind.subtract, vectorType, vectorType),
  new Operator(OperatorKind.multiply, scalarType, vectorType),
  new Operator(OperatorKind.multiply, vectorType, scalarType),
  new Operator(OperatorKind.divide, vectorType, scalarType),
  new Operator(OperatorKind.equal, booleanType, vectorType),
  new Operator(OperatorKind.notEqual, booleanType, vectorType),
  new Operator(OperatorKind.negate, vectorType),
);
