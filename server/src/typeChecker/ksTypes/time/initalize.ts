import { Operator } from '../../models/types/operator';
import { OperatorKind } from '../../types';
import {
  createSetSuffixType,
  createSuffixType,
  noMap,
} from '../../utilities/typeCreators';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';
import { stringType } from '../primitives/string';
import { timeBaseType } from './timebase.ts';
import { timeSpanType } from './timespan';
import { timeStampType } from './timestamp';

let set = false;

export const timeInitializer = () => {
  if (set) {
    return;
  }
  set = true;

  // -------------------- timespan ---------------------------

  timeSpanType.addSuper(noMap(timeBaseType));

  timeSpanType.addSuffixes(
    noMap(createSetSuffixType('year', scalarType)),
    noMap(createSetSuffixType('years', scalarType)),
    noMap(createSetSuffixType('day', scalarType)),
    noMap(createSetSuffixType('days', scalarType)),
    noMap(createSetSuffixType('hour', scalarType)),
    noMap(createSetSuffixType('hours', scalarType)),
    noMap(createSetSuffixType('minute', scalarType)),
    noMap(createSetSuffixType('minutes', scalarType)),
    noMap(createSetSuffixType('second', scalarType)),
    noMap(createSetSuffixType('seconds', scalarType)),
    noMap(createSuffixType('full', stringType)),
  );

  timeSpanType.addOperators(
    // +
    new Operator(timeSpanType, OperatorKind.plus, timeSpanType, timeSpanType),
    new Operator(timeSpanType, OperatorKind.plus, timeStampType, timeStampType),
    new Operator(timeSpanType, OperatorKind.plus, timeSpanType, scalarType),
    // -
    new Operator(
      timeSpanType,
      OperatorKind.subtract,
      timeSpanType,
      timeSpanType,
    ),
    new Operator(
      timeSpanType,
      OperatorKind.subtract,
      timeStampType,
      timeStampType,
    ),
    new Operator(timeSpanType, OperatorKind.subtract, timeSpanType, scalarType),
    // *
    new Operator(timeSpanType, OperatorKind.multiply, timeSpanType, scalarType),
    // /
    new Operator(timeSpanType, OperatorKind.divide, timeSpanType, timeSpanType),
    new Operator(timeSpanType, OperatorKind.divide, timeSpanType, scalarType),
    // <
    new Operator(
      timeSpanType,
      OperatorKind.lessThan,
      booleanType,
      timeSpanType,
    ),
    new Operator(timeSpanType, OperatorKind.lessThan, booleanType, scalarType),
    // >
    new Operator(
      timeSpanType,
      OperatorKind.greaterThan,
      booleanType,
      timeSpanType,
    ),
    new Operator(
      timeSpanType,
      OperatorKind.greaterThan,
      booleanType,
      scalarType,
    ),
    // >=
    new Operator(
      timeSpanType,
      OperatorKind.greaterThanEqual,
      booleanType,
      timeSpanType,
    ),
    new Operator(
      timeSpanType,
      OperatorKind.greaterThanEqual,
      booleanType,
      scalarType,
    ),
    // <=
    new Operator(
      timeSpanType,
      OperatorKind.lessThanEqual,
      booleanType,
      timeSpanType,
    ),
    new Operator(
      timeSpanType,
      OperatorKind.lessThanEqual,
      booleanType,
      scalarType,
    ),
    // <>
    new Operator(
      timeSpanType,
      OperatorKind.notEqual,
      booleanType,
      timeSpanType,
    ),
    // =
    new Operator(timeSpanType, OperatorKind.equal, booleanType, timeSpanType),
  );

  // -------------------- timestamp ---------------------------

  timeStampType.addSuper(noMap(timeBaseType));

  timeStampType.addSuffixes(
    noMap(createSetSuffixType('year', scalarType)),
    noMap(createSetSuffixType('day', scalarType)),
    noMap(createSetSuffixType('hour', scalarType)),
    noMap(createSetSuffixType('minute', scalarType)),
    noMap(createSetSuffixType('second', scalarType)),
    noMap(createSuffixType('seconds', scalarType)),
    noMap(createSuffixType('full', stringType)),
    noMap(createSuffixType('clock', stringType)),
    noMap(createSuffixType('calendar', stringType)),
  );

  timeStampType.addOperators(
    // +
    new Operator(
      timeStampType,
      OperatorKind.plus,
      timeStampType,
      timeStampType,
    ),
    new Operator(timeStampType, OperatorKind.plus, timeStampType, timeSpanType),
    new Operator(timeStampType, OperatorKind.plus, timeStampType, scalarType),
    // -
    new Operator(
      timeStampType,
      OperatorKind.subtract,
      timeSpanType,
      timeStampType,
    ),
    new Operator(
      timeStampType,
      OperatorKind.subtract,
      timeSpanType,
      timeSpanType,
    ),
    new Operator(
      timeStampType,
      OperatorKind.subtract,
      timeStampType,
      scalarType,
    ),
    // *
    new Operator(
      timeStampType,
      OperatorKind.multiply,
      timeStampType,
      scalarType,
    ),
    // /
    new Operator(timeStampType, OperatorKind.divide, timeStampType, scalarType),
    // <
    new Operator(
      timeStampType,
      OperatorKind.lessThan,
      booleanType,
      timeStampType,
    ),
    new Operator(timeStampType, OperatorKind.lessThan, booleanType, scalarType),
    // >
    new Operator(
      timeStampType,
      OperatorKind.greaterThan,
      booleanType,
      timeStampType,
    ),
    new Operator(
      timeStampType,
      OperatorKind.greaterThan,
      booleanType,
      scalarType,
    ),
    // >=
    new Operator(
      timeStampType,
      OperatorKind.greaterThanEqual,
      booleanType,
      timeStampType,
    ),
    new Operator(
      timeStampType,
      OperatorKind.greaterThanEqual,
      booleanType,
      scalarType,
    ),
    // <=
    new Operator(
      timeStampType,
      OperatorKind.lessThanEqual,
      booleanType,
      timeStampType,
    ),
    new Operator(
      timeStampType,
      OperatorKind.lessThanEqual,
      booleanType,
      scalarType,
    ),
    // <>
    new Operator(
      timeStampType,
      OperatorKind.notEqual,
      booleanType,
      timeStampType,
    ),
    // =
    new Operator(timeStampType, OperatorKind.equal, booleanType, timeStampType),
  );
};
