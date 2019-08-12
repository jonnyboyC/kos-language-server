import { createStructureType, createSuffixType, noMap } from '../typeCreators';
import { scalarType } from './primitives/scalar';
import { stringType } from './primitives/string';
import { serializableType } from './primitives/serializeableStructure';
import { OperatorKind } from '../types';
import { booleanType } from './primitives/boolean';
import { Operator } from '../operator';

export const timeSpanType = createStructureType('timeSpan');
timeSpanType.addSuper(noMap(serializableType));

timeSpanType.addSuffixes(
  noMap(createSuffixType('year', scalarType)),
  noMap(createSuffixType('day', scalarType)),
  noMap(createSuffixType('hour', scalarType)),
  noMap(createSuffixType('minute', scalarType)),
  noMap(createSuffixType('second', scalarType)),
  noMap(createSuffixType('seconds', scalarType)),
  noMap(createSuffixType('clock', stringType)),
  noMap(createSuffixType('calendar', stringType)),
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
