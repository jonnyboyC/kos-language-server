import { empty } from '../../utilities/typeGuards';
import { Token } from '../../models/token';
import { TokenType } from '../../models/tokentypes';
import { booleanType } from '../ksTypes/primitives/boolean';
import { integerType, doubleType } from '../ksTypes/primitives/scalar';
import { stringType } from '../ksTypes/primitives/string';
import { OperatorKind, IType, IParametricType } from '../types';
import { bodyTargetType } from '../ksTypes/orbital/bodyTarget';
import { vesselTargetType } from '../ksTypes/orbital/vesselTarget';
import { elementType } from '../ksTypes/parts/element';
import { listType } from '../ksTypes/collections/list';
import { aggregateResourceType } from '../ksTypes/parts/aggregateResource';
import { partType } from '../ksTypes/parts/part';
import { vesselSensorsType } from '../ksTypes/vessel/vesselSensors';
import { dockingPortType } from '../ksTypes/parts/dockingPort';
import { engineType } from '../ksTypes/parts/engine';
import { volumeItemType } from '../ksTypes/io/volumeItem';
import { volumeType } from '../ksTypes/io/volume';
import { kosProcessorFieldsType } from '../ksTypes/kosProcessorFields';
import { rcsType } from '../ksTypes/parts/rcs';

/**
 * This map token types to binary operator kinds
 */
export const binaryOperatorMap: Map<TokenType, OperatorKind> = new Map([
  [TokenType.minus, OperatorKind.subtract],
  [TokenType.multi, OperatorKind.multiply],
  [TokenType.div, OperatorKind.divide],
  [TokenType.plus, OperatorKind.plus],
  [TokenType.power, OperatorKind.power],
  [TokenType.less, OperatorKind.lessThan],
  [TokenType.lessEqual, OperatorKind.lessThanEqual],
  [TokenType.greater, OperatorKind.greaterThan],
  [TokenType.greaterEqual, OperatorKind.greaterThanEqual],
  [TokenType.and, OperatorKind.and],
  [TokenType.or, OperatorKind.or],
  [TokenType.equal, OperatorKind.equal],
  [TokenType.notEqual, OperatorKind.notEqual],
]);

/**
 * This maps tokens types to unary operator kinds
 */
export const unaryOperatorMap: Map<TokenType, OperatorKind> = new Map([
  [TokenType.not, OperatorKind.not],
  [TokenType.defined, OperatorKind.defined],
  [TokenType.minus, OperatorKind.negate],
  [TokenType.plus, OperatorKind.negate],
]);

/**
 * This maps list target to types
 */
export const listTypeMap: Map<string, IType> = new Map([
  ['bodies', bodyTargetType],
  ['targets', vesselTargetType],
  ['elements', elementType],
  ['resources', listType.apply(aggregateResourceType)],
  ['parts', partType],
  ['sensors', vesselSensorsType],
  ['dockingports', dockingPortType],
  ['rcs', rcsType],
  ['engines', engineType],
  ['files', volumeItemType],
  ['fonts', stringType],
  ['volumes', volumeType],
  ['processors', kosProcessorFieldsType],
]);

/**
 * Retrieve the type of the follow token
 * @param token token to retrieve
 */
export const tokenTrackedType = (token: Token): Maybe<IType> => {
  // check literals and other tokens
  switch (token.type) {
    case TokenType.true:
    case TokenType.false:
      return booleanType;
    case TokenType.integer:
      return integerType;
    case TokenType.double:
      return doubleType;
    case TokenType.string:
    case TokenType.fileIdentifier:
      return stringType;
    default:
      // if not a literally we need to lookup tracker
      const { tracker } = token;
      if (empty(tracker)) {
        return undefined;
      }

      return tracker.getType({ uri: token.uri, range: token });
  }
};

/**
 * Create a pass type parameter for generics with only one parameter
 * @param type the type to create a pass through
 * @param superType the super type to create a pass through
 */
export const passThroughTypeParameter = (
  type: IParametricType,
  superType: IParametricType,
): Map<IParametricType, IParametricType> => {
  const superTypeParams = superType.getTypeParameters();
  const typeParams = type.getTypeParameters();

  if (superTypeParams.length !== 1) {
    throw new Error(
      `Super type ${superType.name} does not have` +
        ` one type parameter but instead has ${superTypeParams.join(', ')}.`,
    );
  }

  if (typeParams.length !== 1) {
    throw new Error(
      `Type ${superType.name} does not have` +
        ` one type parameter but instead has ${superTypeParams.join(', ')}.`,
    );
  }

  return new Map([[typeParams[0], superTypeParams[0]]]);
};
