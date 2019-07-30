import { createStructureType, createSuffixType } from '../typeCreators';
import { scalarType } from './primitives/scalar';
import { stringType } from './primitives/string';
import { serializableStructureType } from './primitives/serializeableStructure';
import { OperatorKind } from '../types';
import { booleanType } from './primitives/boolean';

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
  {
    operator: OperatorKind.plus,
    other: timeSpanType,
    returnType: timeSpanType,
  },
  {
    operator: OperatorKind.plus,
    other: scalarType,
    returnType: timeSpanType,
  },
  // -
  {
    operator: OperatorKind.subtract,
    other: timeSpanType,
    returnType: timeSpanType,
  },
  {
    operator: OperatorKind.subtract,
    other: scalarType,
    returnType: timeSpanType,
  },
  // *
  {
    operator: OperatorKind.multiply,
    other: scalarType,
    returnType: timeSpanType,
  },
  // /
  {
    operator: OperatorKind.divide,
    other: timeSpanType,
    returnType: timeSpanType,
  },
  {
    operator: OperatorKind.divide,
    other: scalarType,
    returnType: timeSpanType,
  },
  // <
  {
    operator: OperatorKind.greaterThan,
    other: timeSpanType,
    returnType: booleanType,
  },
  {
    operator: OperatorKind.greaterThan,
    other: scalarType,
    returnType: booleanType,
  },
  // >
  {
    operator: OperatorKind.lessThan,
    other: timeSpanType,
    returnType: booleanType,
  },
  {
    operator: OperatorKind.lessThan,
    other: scalarType,
    returnType: booleanType,
  },
  // >=
  {
    operator: OperatorKind.greaterThanEqual,
    other: timeSpanType,
    returnType: booleanType,
  },
  {
    operator: OperatorKind.greaterThanEqual,
    other: scalarType,
    returnType: booleanType,
  },
  // <=
  {
    operator: OperatorKind.lessThanEqual,
    other: timeSpanType,
    returnType: booleanType,
  },
  {
    operator: OperatorKind.lessThanEqual,
    other: scalarType,
    returnType: booleanType,
  },
  // <>
  {
    operator: OperatorKind.notEqual,
    other: timeSpanType,
    returnType: booleanType,
  },
  // =
  {
    operator: OperatorKind.equal,
    other: timeSpanType,
    returnType: booleanType,
  },
);
