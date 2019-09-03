import { BasicBlock } from './basicBlock';
import { IExpr } from '../parser/types';

export class BranchJump {
  public readonly condition: IExpr;
  public readonly trueBlock: BasicBlock;
  public readonly falseBlock: BasicBlock;

  constructor(condition: IExpr, trueBlock: BasicBlock, falseBlock: BasicBlock) {
    this.condition = condition;
    this.trueBlock = trueBlock;
    this.falseBlock = falseBlock;
  }
}
