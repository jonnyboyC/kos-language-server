import { DirectiveTokens } from './types';
import { TokenType } from '../models/tokentypes';

/**
 * Determine if this directive is of a certain type
 * @param type expected directive type
 * @param directive directive
 */
export const isDirective = <T extends TokenType>(
  type: T,
  directive: DirectiveTokens,
): directive is DirectiveTokens<T> => {
  return directive.directive.type === type;
};

/**
 * Create a type guard for a given type
 * @param type type to guard
 */
const makeDirectiveGuard = <T extends TokenType>(type: T) => (
  directive: DirectiveTokens,
): directive is DirectiveTokens<T> => isDirective(type, directive);

/**
 * Determine if this directive is an include directive
 * @param directive directive to check
 */
export const isInclude = makeDirectiveGuard(TokenType.include);

/**
 * Determine if this directive is an region directive
 * @param directive directive to check
 */
export const isRegion = makeDirectiveGuard(TokenType.region);

/**
 * Determine if this directive is an endRegion directive
 * @param directive directive to check
 */
export const isEndRegion = makeDirectiveGuard(TokenType.endRegion);
