import { empty } from '../utilities/typeGuards';
import { Token } from '../entities/token';
import { TokenType } from '../entities/tokentypes';
import { booleanType } from './types/primitives/boolean';
import { integerType, doubleType } from './types/primitives/scalar';
import { stringType } from './types/primitives/string';
import { CallKind, OperatorKind, IType } from './types';

/**
 * This map token types to binary operator kinds
 */
export const binaryOperatorMap: Map<TokenType, OperatorKind> = new Map([
  [TokenType.minus, OperatorKind.subtract],
  [TokenType.multi, OperatorKind.multiply],
  [TokenType.div, OperatorKind.divide],
  [TokenType.plus, OperatorKind.plus],
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
 * check if the target call type is compatable with real call type
 * @param queryCallType real call type
 * @param targetCallType query call type
 */
export const isCorrectCallType = (
  queryCallType: CallKind,
  targetCallType: CallKind,
): boolean => {
  switch (queryCallType) {
    case CallKind.optionalCall:
      return (
        targetCallType === CallKind.get ||
        targetCallType === CallKind.call ||
        targetCallType === CallKind.optionalCall
      );
    case CallKind.get:
    case CallKind.set:
    case CallKind.call:
      return targetCallType === queryCallType;
  }
};
