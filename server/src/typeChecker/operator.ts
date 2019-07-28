import { OperatorKind, IGenericType, IType } from './types';
import { empty } from '../utilities/typeGuards';

export class Operator<T extends IGenericType = IType> {
  /**
   * What operator kind associated with this operator
   */
  public readonly operator: OperatorKind;

  /**
   * What is the other operand for this operator
   */
  public readonly otherOperand?: T;

  /**
   * What is the return type of this operator
   */
  public readonly returnType: T;

  /**
   * Construct and instance of an operator
   * @param operator what is the operator kind
   * @param otherOperand what else need to appear in this operation
   * @param returnType what is the return type of this operation
   */
  constructor(operator: OperatorKind, returnType: T, otherOperand?: T) {
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
