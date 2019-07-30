import { createStructureType, createSuffixType } from '../typeCreators';
import { vectorType } from './collections/vector';
import { scalarType } from './primitives/scalar';
import { serializableStructureType } from './primitives/serializeableStructure';
import { OperatorKind } from '../types';
import { booleanType } from './primitives/boolean';

export const directionType = createStructureType('direction');
directionType.addSuper(serializableStructureType);

directionType.addSuffixes(
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

directionType.addOperators(
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
    returnType: directionType,
    other: undefined,
  },
);
