import { IArgumentType, Operator } from '../types';
import { createStructureType } from '../ksType';
import { addOperators, addPrototype } from '../../typeUitlities';
import { primitiveType } from './primitives';

// ---------- base of boolean types --------------------
export const booleanType: IArgumentType = createStructureType('boolean');
addOperators(
  booleanType,
  [Operator.notEqual, booleanType],
  [Operator.equal, booleanType],
);
addPrototype(booleanType, primitiveType);
