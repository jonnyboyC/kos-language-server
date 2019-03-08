import { ITypeError } from './types';
import { Position, Range } from 'vscode-languageserver';

/**
 * Class that implements the ITypeError interface
 */
export class KsTypeError implements ITypeError {
  constructor(
    public readonly range: Range,
    public readonly message: string,
    public readonly otherInfo: string[],
  ) { }

  /**
   * Start position of error
   */
  get start(): Position {
    return this.range.start;
  }

  /**
   * End position of the error
   */
  get end(): Position {
    return this.range.end;
  }

  /**
   * Discriminated union tag
   */
  get tag(): 'typeError' {
    return 'typeError';
  }
}
