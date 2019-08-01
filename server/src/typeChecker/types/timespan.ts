import { createStructureType, createSuffixType } from '../typeCreators';
import { scalarType } from './primitives/scalar';
import { stringType } from './primitives/string';
import { serializableStructureType } from './primitives/serializeableStructure';
import { OperatorKind } from '../types';
import { booleanType } from './primitives/boolean';
import { Operator } from '../operator';

export const timeSpanType = createStructureType('timeSpan');
timeSpanType.addSuper(serializableStructureType);

timeSpanType.addSuffixes(
  createSuffixType('year', scalarType),
  createSuffixType('day', scalarType),
  createSuffixType('hour', scalarType),
  createSuffixType('minute', scalarType),
  createSuffixType('second', scalarType),
  createSuffixType('seconds', scalarType),
  createSuffixType('clock', stringType),
  createSuffixType('calendar', stringType),
);

timeSpanType.addOperators(
  // +
  new Operator(OperatorKind.plus, timeSpanType, timeSpanType),
  new Operator(OperatorKind.plus, timeSpanType, scalarType),
  // -
  new Operator(OperatorKind.subtract, timeSpanType, timeSpanType),
  new Operator(OperatorKind.subtract, timeSpanType, scalarType),
  // *
  new Operator(OperatorKind.multiply, timeSpanType, scalarType),
  // /
  new Operator(OperatorKind.divide, timeSpanType, timeSpanType),
  new Operator(OperatorKind.divide, timeSpanType, scalarType),
  // <
  new Operator(OperatorKind.lessThan, booleanType, timeSpanType),
  new Operator(OperatorKind.lessThan, booleanType, scalarType),
  // >
  new Operator(OperatorKind.greaterThan, booleanType, timeSpanType),
  new Operator(OperatorKind.greaterThan, booleanType, scalarType),
  // >=
  new Operator(OperatorKind.greaterThanEqual, booleanType, timeSpanType),
  new Operator(OperatorKind.greaterThanEqual, booleanType, scalarType),
  // <=
  new Operator(OperatorKind.lessThanEqual, booleanType, timeSpanType),
  new Operator(OperatorKind.lessThanEqual, booleanType, scalarType),
  // <>
  new Operator(OperatorKind.notEqual, booleanType, timeSpanType),
  // =
  new Operator(OperatorKind.equal, booleanType, timeSpanType),
);
