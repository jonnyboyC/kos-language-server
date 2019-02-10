import { ITypeError } from './types';
import { Position, Range } from 'vscode-languageserver';

export class KsTypeError implements ITypeError {
  constructor(
    public readonly range: Range,
    public readonly message: string,
    public readonly otherInfo: string[],
  ) { }

  get start(): Position {
    return this.range.start;
  }

  get end(): Position {
    return this.range.end;
  }

  get tag(): 'typeError' {
    return 'typeError';
  }
}
