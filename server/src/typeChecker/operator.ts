import { ArgumentType } from './types/types';
import { OperatorKind } from './types';
import { empty } from '../utilities/typeGuards';

export class Operator {
  /**
   * What operator kind associated with this operator
   */
  public readonly operator: OperatorKind;

  /**
   * What is the other operand for this operator
   */
  public readonly otherOperand?: ArgumentType;

  /**
   * What is the return type of this operator
   */
  public readonly returnType: ArgumentType;

  /**
   * Construct and instance of an operator
   * @param operator what is the operator kind
   * @param otherOperand what else need to appear in this operation
   * @param returnType what is the return type of this operation
   */
  constructor(
    operator: OperatorKind,
    returnType: ArgumentType,
    otherOperand?: ArgumentType,
  ) {
    this.operator = operator;
    this.otherOperand = otherOperand;
    this.returnType = returnType;
  }

  /**
   * Is the operator a unary operator
   */
  public isUnary(): boolean {
    return empty(this.otherOperand);
  }
}
