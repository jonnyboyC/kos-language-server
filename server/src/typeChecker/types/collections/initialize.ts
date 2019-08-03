import { vectorType } from './vector';
import { serializableStructureType } from '../primitives/serializeableStructure';
import { createSetSuffixType, createSuffixType } from '../../typeCreators';
import { scalarType } from '../primitives/scalar';
import { Operator } from '../../operator';
import { OperatorKind } from '../../types';
import { booleanType } from '../primitives/boolean';
import { directionType } from './direction';

let set = false;

export const collectionInitializer = () => {
  if (set) {
    return;
  }
  set = true;

  vectorType.addSuper(serializableStructureType);

  vectorType.addSuffixes(
    createSetSuffixType('x', scalarType),
    createSetSuffixType('y', scalarType),
    createSetSuffixType('z', scalarType),
    createSetSuffixType('mag', scalarType),
    createSuffixType('vec', vectorType),
    createSuffixType('normalized', vectorType),
    createSuffixType('sqrMagnitude', scalarType),
    createSetSuffixType('direction', scalarType),
  );

  vectorType.addOperators(
    new Operator(OperatorKind.plus, vectorType, vectorType),
    new Operator(OperatorKind.subtract, vectorType, vectorType),
    new Operator(OperatorKind.multiply, scalarType, vectorType),
    new Operator(OperatorKind.multiply, vectorType, scalarType),
    new Operator(OperatorKind.divide, vectorType, scalarType),
    new Operator(OperatorKind.equal, booleanType, vectorType),
    new Operator(OperatorKind.notEqual, booleanType, vectorType),
    new Operator(OperatorKind.negate, vectorType),
  );
  vectorType.addCoercion(directionType);

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
};
