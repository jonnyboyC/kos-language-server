import { IToken } from './types';
import { IInst } from '../parser/types';
import { Range } from 'vscode-languageserver';

export class SyntaxTree {
  constructor(
    public readonly start: IToken,
    public readonly insts: IInst[],
    public readonly end: IToken,
  )
  { }

  public get range(): Range {
    return {
      start: this.start.start,
      end: this.end.end,
    };
  }
}
