import { Token } from '../models/token';
import { TokenType } from '../models/tokentypes';
import { DirectiveTokens } from './types';

/**
 * Generate new basic directives that follow the form #directive
 */
export class BasicDirective<T extends TokenType> {
  /**
   *
   */
  directive: Token<T>;

  /**
   * Construct a new
   * @param directive
   */
  constructor(directive: Token<T>) {
    this.directive = directive;
  }

  /**
   * Attempt to parse a include directive
   * @param directive include directive
   */
  static parse<T extends TokenType>(
    directive: DirectiveTokens<T>,
  ): BasicDirective<T> {
    return new BasicDirective(directive.directive);
  }
}
