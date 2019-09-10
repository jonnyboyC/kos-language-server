import { BasicBlock } from './basicBlock';
import { IExpr } from '../parser/types';
import { ReachableJumps } from './types';
import { Narrowing } from './narrowing';

/**
 * A class representing control from through a branch jump
 */
export class BranchJump {
  /**
   * What was the condition associated with this jump
   */
  public readonly condition: IExpr;

  /**
   * What is the basic block associated the true branch
   */
  public readonly trueBlock: BasicBlock;

  /**
   * What is the basic block associated the false branch
   */
  public readonly falseBlock: BasicBlock;

  /**
   * what branches are reachable
   */
  public reachable: ReachableJumps;

  /**
   * What narrowings are applied on the true branch
   */
  public narrowings: Narrowing[];

  /**
   * Construct a new branch jump
   * @param condition the condition associated with the branch
   * @param trueBlock the true basic block
   * @param falseBlock the false basic block
   */
  constructor(condition: IExpr, trueBlock: BasicBlock, falseBlock: BasicBlock) {
    this.condition = condition;
    this.trueBlock = trueBlock;
    this.falseBlock = falseBlock;
    this.reachable = ReachableJumps.both;
    this.narrowings = [];
  }
}
