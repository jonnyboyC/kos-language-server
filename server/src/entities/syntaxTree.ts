import { IToken } from './types';
import { IInst, IRangeSequence } from '../parser/types';
import { Range, Position } from 'vscode-languageserver';

export class SyntaxTree implements IRangeSequence {
  constructor(
    public readonly startToken: IToken,
    public readonly insts: IInst[],
    public readonly endToken: IToken,
  )
  { }

  public get start(): Position {
    return this.startToken.start;
  }

  public get end(): Position {
    return this.endToken.end;
  }

  public get ranges(): Range[] {
    return [this.startToken, ...this.insts, this.endToken];
  }
}
