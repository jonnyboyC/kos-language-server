import { IArgumentType, Operator } from '../types';
import { createStructureType } from '../ksType';
import { addOperators, addPrototype } from '../typeUitlities';

import { booleanType } from './boolean';
import { primitiveType } from './primitives';

// ---------- base of number types ---------------------
export const scalarType: IArgumentType = createStructureType('scalar');
addOperators(
  scalarType,
  [Operator.plus, scalarType],
  [Operator.subtract, scalarType],
  [Operator.multiply, scalarType],
  [Operator.divide, scalarType],
  [Operator.power, scalarType],
  [Operator.greaterThan, booleanType],
  [Operator.lessThan, booleanType],
  [Operator.greaterThanEqual, booleanType],
  [Operator.lessThanEqual, booleanType],
  [Operator.notEqual, booleanType],
  [Operator.equal, booleanType],
);
addPrototype(scalarType, primitiveType);

export const integarType: IArgumentType = createStructureType('int');
addPrototype(integarType, scalarType);

export const doubleType: IArgumentType = createStructureType('double');
addPrototype(doubleType, scalarType);
