import { OperatorKind, IParametricType, IType } from '../types';
import { empty } from '../../utilities/typeGuards';

export class Operator<T extends IParametricType = IType> {
  /**
   * primarily used as part of the ITypeMappable interface
   */
  public readonly name: string;

  /**
   * What operator kind associated with this operator
   */
  public readonly operator: OperatorKind;

  /**
   * What is the other operand for this operator
   */
  public readonly firstOperand: T;

  /**
   * What is the other operand for this operator
   */
  public readonly secondOperand?: T;

  /**
   * What is the return type of this operator
   */
  public readonly returnType: T;

  /**
   * Construct and instance of an operator
   * @param firstOperand What is the first operand
   * @param operator what is the operator kind
   * @param otherOperand what else need to appear in this operation
   * @param returnType what is the return type of this operation
   */
  constructor(
    firstOperand: T,
    operator: OperatorKind,
    returnType: T,
    otherOperand?: T,
  ) {
    this.name = 'Operator';
    this.firstOperand = firstOperand;
    this.operator = operator;
    this.secondOperand = otherOperand;
    this.returnType = returnType;
  }

  /**
   * Is the operator a unary operator
   */
  public isUnary(): boolean {
    return empty(this.secondOperand);
  }
}
