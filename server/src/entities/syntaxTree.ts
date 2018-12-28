import { IInst, IRangeSequence } from '../parser/types';
import { Range, Position } from 'vscode-languageserver';

export class SyntaxTree implements IRangeSequence {
  constructor(public readonly insts: IInst[])
  { }

  public get start(): Position {
    return this.insts[0].start;
  }

  public get end(): Position {
    return this.insts[this.insts.length - 1].end;
  }

  public get ranges(): Range[] {
    return [...this.insts];
  }
}
