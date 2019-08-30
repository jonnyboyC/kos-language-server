import { IStmt, IExpr } from '../parser/types';

/**
 * A sequence of expressions of statements representing a basic block with no jumps
 */
export class BasicBlock {
  /**
   * What is the sequence of nodes executed in this basic block
   */
  public readonly nodes: (IExpr | IStmt)[];

  /**
   * What are the jumps available in this basic block
   */
  public readonly jumps: BasicBlock[];

  /**
   * Construct a new basic block
   */
  constructor() {
    this.nodes = [];
    this.jumps = [];
  }
}
