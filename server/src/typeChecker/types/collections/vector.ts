import { ArgumentType } from '../types';
import {
  createSetSuffixType,
  createSuffixType,
  createStructureType,
} from '../../typeCreators';
import { addPrototype, addSuffixes, addOperators } from '../../typeUitlities';
import { scalarType } from '../primitives/scalar';
import { serializableStructureType } from '../primitives/serializeableStructure';
import { OperatorKind } from '../../types';
import { booleanType } from '../primitives/boolean';

export const vectorType: ArgumentType = createStructureType('vector');
addPrototype(vectorType, serializableStructureType);

addSuffixes(
  vectorType,
  createSetSuffixType('x', scalarType),
  createSetSuffixType('y', scalarType),
  createSetSuffixType('z', scalarType),
  createSetSuffixType('mag', scalarType),
  createSuffixType('vec', vectorType),
  createSuffixType('normalized', vectorType),
  createSuffixType('sqrMagnitude', scalarType),
  createSetSuffixType('direction', scalarType),
);

addOperators(
  vectorType,
  {
    operator: OperatorKind.plus,
    returnType: vectorType,
    other: vectorType,
  },
  {
    operator: OperatorKind.subtract,
    returnType: vectorType,
    other: vectorType,
  },
  {
    operator: OperatorKind.multiply,
    returnType: scalarType,
    other: vectorType,
  },
  {
    operator: OperatorKind.multiply,
    returnType: vectorType,
    other: scalarType,
  },
  {
    operator: OperatorKind.divide,
    returnType: vectorType,
    other: scalarType,
  },
  {
    operator: OperatorKind.equal,
    returnType: booleanType,
    other: vectorType,
  },
  {
    operator: OperatorKind.notEqual,
    returnType: booleanType,
    other: vectorType,
  },
  {
    operator: OperatorKind.negate,
    returnType: vectorType,
    other: undefined,
  },
);
