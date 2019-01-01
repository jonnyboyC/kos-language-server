import { IParseError } from './types';
import { IToken } from '../entities/types';
import { Position } from 'vscode-languageserver';

export class ParseError implements IParseError {

  public readonly inner: IParseError[];

  constructor(
    public readonly token: IToken,
    public readonly message: string,
    public readonly otherInfo: string[]) {
    this.inner = [];
  }

  get start(): Position {
    return this.token.start;
  }

  get end(): Position {
    return this.token.end;
  }

  get tag(): 'parseError' {
    return 'parseError';
  }
}
