import { IResolverError, ResolverErrorKind } from './types';
import { Position, Range } from 'vscode-languageserver';

export class ResolverError implements IResolverError {
  constructor(
    public readonly range: Range,
    public readonly message: string,
    public readonly kind: ResolverErrorKind,
    public readonly otherInfo: string[]) {
  }

  get start(): Position {
    return this.range.start;
  }

  get end(): Position {
    return this.range.end;
  }
}
