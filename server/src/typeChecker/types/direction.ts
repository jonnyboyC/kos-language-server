import { createStructureType, createSuffixType } from '../typeCreators';
import { vectorType } from './collections/vector';
import { scalarType } from './primitives/scalar';
import { serializableStructureType } from './primitives/serializeableStructure';
import { OperatorKind } from '../types';
import { Operator } from '../operator';

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
  new Operator(OperatorKind.multiply, directionType, directionType),
  new Operator(OperatorKind.multiply, vectorType, vectorType),
  new Operator(OperatorKind.plus, directionType, directionType),
  new Operator(OperatorKind.plus, vectorType, vectorType),
  new Operator(OperatorKind.subtract, directionType, directionType),
  new Operator(OperatorKind.equal, vectorType, vectorType),
  new Operator(OperatorKind.notEqual, vectorType, vectorType),
  new Operator(OperatorKind.negate, directionType),
);
