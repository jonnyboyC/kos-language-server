import { IStmt, IScript, RunStmtType, SyntaxKind } from '../parser/types';
import { Range, Position, Location } from 'vscode-languageserver';
import { NodeBase } from '../parser/base';
import { flatten } from '../utilities/arrayUtils';

export class Script extends NodeBase implements IScript {
  constructor(
    public readonly uri: string,
    public readonly stmts: IStmt[],
    public readonly runStmts: RunStmtType[],
    public lazyGlobal = true) {
    super();
  }

  public toLines(): string[] {
    return flatten(this.stmts.map(stmt => stmt.toLines()));
  }

  public get start(): Position {
    return this.stmts[0].start;
  }

  public get end(): Position {
    return this.stmts[this.stmts.length - 1].end;
  }

  public get ranges(): Range[] {
    return [...this.stmts];
  }

  toLocation(): Location {
    return { uri: this.uri, range: { start: this.start, end: this.end } };
  }

  public get tag(): SyntaxKind.script {
    return SyntaxKind.script;
  }
}
