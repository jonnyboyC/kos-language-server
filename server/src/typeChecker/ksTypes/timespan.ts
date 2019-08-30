import { createType, createSuffixType, noMap } from '../utilities/typeCreators';
import { scalarType } from './primitives/scalar';
import { stringType } from './primitives/string';
import { serializableType } from './primitives/serializeableStructure';
import { OperatorKind } from '../types';
import { booleanType } from './primitives/boolean';
import { Operator } from '../types/operator';

export const timeSpanType = createType('timeSpan');
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
  new Operator(timeSpanType, OperatorKind.plus, timeSpanType, timeSpanType),
  new Operator(timeSpanType, OperatorKind.plus, timeSpanType, scalarType),
  // -
  new Operator(timeSpanType, OperatorKind.subtract, timeSpanType, timeSpanType),
  new Operator(timeSpanType, OperatorKind.subtract, timeSpanType, scalarType),
  // *
  new Operator(timeSpanType, OperatorKind.multiply, timeSpanType, scalarType),
  // /
  new Operator(timeSpanType, OperatorKind.divide, timeSpanType, timeSpanType),
  new Operator(timeSpanType, OperatorKind.divide, timeSpanType, scalarType),
  // <
  new Operator(timeSpanType, OperatorKind.lessThan, booleanType, timeSpanType),
  new Operator(timeSpanType, OperatorKind.lessThan, booleanType, scalarType),
  // >
  new Operator(timeSpanType, OperatorKind.greaterThan, booleanType, timeSpanType),
  new Operator(timeSpanType, OperatorKind.greaterThan, booleanType, scalarType),
  // >=
  new Operator(timeSpanType, OperatorKind.greaterThanEqual, booleanType, timeSpanType),
  new Operator(timeSpanType, OperatorKind.greaterThanEqual, booleanType, scalarType),
  // <=
  new Operator(timeSpanType, OperatorKind.lessThanEqual, booleanType, timeSpanType),
  new Operator(timeSpanType, OperatorKind.lessThanEqual, booleanType, scalarType),
  // <>
  new Operator(timeSpanType, OperatorKind.notEqual, booleanType, timeSpanType),
  // =
  new Operator(timeSpanType, OperatorKind.equal, booleanType, timeSpanType),
);
