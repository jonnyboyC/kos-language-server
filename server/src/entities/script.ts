import { IInst, IScript } from '../parser/types';
import { Range, Position, Location } from 'vscode-languageserver';

export class Script implements IScript {
  constructor(
    public readonly uri: string,
    public readonly insts: IInst[])
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

  toLocation(): Location {
    return { uri: this.uri, range: { start: this.start, end: this.end } };
  }

  public get tag(): 'script' {
    return 'script';
  }
}
