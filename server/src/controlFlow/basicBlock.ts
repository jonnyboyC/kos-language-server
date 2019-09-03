import { BlockKind } from './types';
import { empty } from '../utilities/typeGuards';
import { BranchJump } from './branchJump';
import { IStmt, IExpr } from '../parser/types';

/**
 * A sequence of expressions of statements representing a basic block with no jumps
 */
export class BasicBlock implements GraphNode<BasicBlock> {
  public readonly stmt: Maybe<IStmt>;

  /**
   * What is the sequence of nodes executed in this basic block
   */
  public readonly exprs: IExpr[];

  /**
   * What kind of block is this block
   */
  public readonly kind: BlockKind;

  /**
   * What are the jumps available in this basic block
   */
  private jump: Maybe<BasicBlock | BranchJump>;

  /**
   * Construct a new basic block
   */
  constructor(kind: BlockKind, stmt?: IStmt) {
    this.kind = kind;
    this.stmt = stmt;
    this.exprs = [];
    this.jump = undefined;
  }

  /**
   * Add a jump to this basic block
   * @param jump jump to add
   */
  public addJump(jump: BasicBlock | BranchJump) {
    if (!empty(this.jump)) {
      throw new Error('Jump already filled');
    }

    this.jump = jump;
  }

  /**
   * Get the current jump
   */
  public getJumps(): Maybe<BasicBlock | BranchJump> {
    return this.jump;
  }

  /**
   * Implement graph interface. WHat is the node value
   */
  public value(): BasicBlock {
    return this;
  }

  /**
   * Implement the graph interface. What are the adjacent node
   */
  public adjacentNodes(): GraphNode<BasicBlock>[] {
    if (empty(this.jump)) {
      return [];
    }

    return this.jump instanceof BasicBlock
      ? [this.jump]
      : [this.jump.trueBlock, this.jump.falseBlock];
  }
}
