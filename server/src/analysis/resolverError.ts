import { IResolverError } from './types';
import { IToken } from '../entities/types';
import { Position } from 'vscode-languageserver';

export class ResolverError implements IResolverError {
  constructor(
    public readonly token: IToken,
    public readonly message: string,
    public readonly otherInfo: string[]) {
  }

  get start(): Position {
    return this.token.start;
  }

  get end(): Position {
    return this.token.end;
  }
}
