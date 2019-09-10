import { TreeTraverse } from '../parser/treeTraverse';
import { IStmt, IScript } from '../parser/types';
import { BasicBlock } from './basicBlock';
import { BlockKind } from './types';

export class GenerateBlocks extends TreeTraverse {
  public readonly stmtBlocks: Map<IStmt, BasicBlock>;
  public readonly script: IScript;

  constructor(script: IScript) {
    super();

    this.script = script;
    this.stmtBlocks = new Map();
  }

  public generate(): Map<IStmt, BasicBlock> {
    for (const stmt of this.script.stmts) {
      this.stmtAction(stmt);
    }

    return this.stmtBlocks;
  }

  public stmtAction(stmt: IStmt) {
    this.stmtBlocks.set(stmt, new BasicBlock(BlockKind.basic, stmt));
    return stmt.accept(this, []);
  }
}
