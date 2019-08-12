import { vectorType } from './vector';
import { serializableType } from '../primitives/serializeableStructure';
import {
  createSetSuffixType,
  createSuffixType,
  noMap,
} from '../../typeCreators';
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

  vectorType.addSuper(noMap(serializableType));

  vectorType.addSuffixes(
    noMap(createSetSuffixType('x', scalarType)),
    noMap(createSetSuffixType('y', scalarType)),
    noMap(createSetSuffixType('z', scalarType)),
    noMap(createSetSuffixType('mag', scalarType)),
    noMap(createSuffixType('vec', vectorType)),
    noMap(createSuffixType('normalized', vectorType)),
    noMap(createSuffixType('sqrMagnitude', scalarType)),
    noMap(createSetSuffixType('direction', scalarType)),
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

  directionType.addSuper(noMap(serializableType));
  directionType.addSuffixes(
    noMap(createSuffixType('pitch', scalarType)),
    noMap(createSuffixType('yaw', scalarType)),
    noMap(createSuffixType('roll', scalarType)),
    noMap(createSuffixType('forVector', vectorType)),
    noMap(createSuffixType('vector', vectorType)),
    noMap(createSuffixType('topVector', vectorType)),
    noMap(createSuffixType('upVector', vectorType)),
    noMap(createSuffixType('starVector', vectorType)),
    noMap(createSuffixType('rightVector', vectorType)),
    noMap(createSuffixType('inverse', directionType)),
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
