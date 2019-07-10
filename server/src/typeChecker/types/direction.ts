import { ArgumentType } from './types';
import { createStructureType, createSuffixType } from '../typeCreators';
import { addPrototype, addSuffixes, addOperators } from '../typeUitlities';
import { vectorType } from './collections/vector';
import { scalarType } from './primitives/scalar';
import { serializableStructureType } from './primitives/serializeableStructure';
import { OperatorKind } from '../types';
import { booleanType } from './primitives/boolean';

export const directionType: ArgumentType = createStructureType('direction');
addPrototype(directionType, serializableStructureType);

addSuffixes(
  directionType,
  createSuffixType('pitch', scalarType),
  createSuffixType('yaw', scalarType),
  createSuffixType('roll', scalarType),
  createSuffixType('forVector', vectorType),
  createSuffixType('vector', vectorType),
  createSuffixType('topVector', vectorType),
  createSuffixType('upVector', vectorType),
  createSuffixType('starVector', vectorType),
  createSuffixType('rightVector', vectorType),
  createSuffixType('inverse', directionType),
);

addOperators(
  directionType,
  {
    operator: OperatorKind.multiply,
    other: directionType,
    returnType: directionType,
  },
  {
    operator: OperatorKind.multiply,
    other: vectorType,
    returnType: vectorType,
  },
  {
    operator: OperatorKind.plus,
    other: vectorType,
    returnType: vectorType,
  },
  {
    operator: OperatorKind.plus,
    other: directionType,
    returnType: directionType,
  },
  {
    operator: OperatorKind.subtract,
    other: directionType,
    returnType: directionType,
  },
  {
    operator: OperatorKind.equal,
    other: directionType,
    returnType: booleanType,
  },
  {
    operator: OperatorKind.notEqual,
    other: directionType,
    returnType: booleanType,
  },
  {
    operator: OperatorKind.negate,
    returnType: booleanType,
    other: undefined,
  },
);
