import { vectorType } from './vector';
import { serializableType } from '../primitives/serializeableStructure';
import {
  createSetSuffixType,
  createSuffixType,
  noMap,
} from '../../utilities/typeCreators';
import { scalarType } from '../primitives/scalar';
import { Operator } from '../../types/operator';
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
    new Operator(vectorType, OperatorKind.plus, vectorType, vectorType),
    new Operator(vectorType, OperatorKind.subtract, vectorType, vectorType),
    new Operator(vectorType, OperatorKind.multiply, scalarType, vectorType),
    new Operator(vectorType, OperatorKind.multiply, vectorType, scalarType),
    new Operator(vectorType, OperatorKind.divide, vectorType, scalarType),
    new Operator(vectorType, OperatorKind.equal, booleanType, vectorType),
    new Operator(vectorType, OperatorKind.notEqual, booleanType, vectorType),
    new Operator(vectorType, OperatorKind.negate, vectorType),
  );
  vectorType.addCoercion(directionType);

  directionType.addSuper(noMap(serializableType));
  directionType.addSuffixes(
    noMap(createSuffixType('pitch', scalarType)),
    noMap(createSuffixType('yaw', scalarType)),
    noMap(createSuffixType('roll', scalarType)),
    noMap(createSuffixType('foreVector', vectorType)),
    noMap(createSuffixType('vector', vectorType)),
    noMap(createSuffixType('topVector', vectorType)),
    noMap(createSuffixType('upVector', vectorType)),
    noMap(createSuffixType('starVector', vectorType)),
    noMap(createSuffixType('rightVector', vectorType)),
    noMap(createSuffixType('inverse', directionType)),
  );

  directionType.addOperators(
    new Operator(
      directionType,
      OperatorKind.multiply,
      directionType,
      directionType,
    ),
    new Operator(directionType, OperatorKind.multiply, vectorType, vectorType),
    new Operator(
      directionType,
      OperatorKind.plus,
      directionType,
      directionType,
    ),
    new Operator(directionType, OperatorKind.plus, vectorType, vectorType),
    new Operator(
      directionType,
      OperatorKind.subtract,
      directionType,
      directionType,
    ),
    new Operator(directionType, OperatorKind.equal, vectorType, vectorType),
    new Operator(directionType, OperatorKind.notEqual, vectorType, vectorType),
    new Operator(directionType, OperatorKind.negate, directionType),
  );
};
