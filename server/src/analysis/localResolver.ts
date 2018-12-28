import { IExprVisitor, IExpr } from '../parser/types';
import {
  BinaryExpr, UnaryExpr, FactorExpr, SuffixExpr,
  CallExpr, ArrayIndexExpr, ArrayBracketExpr, DelegateExpr,
  LiteralExpr, VariableExpr, GroupingExpr, AnonymousFunctionExpr,
  InvalidExpr,
} from '../parser/expr';
import { IToken } from '../entities/types';

export class LocalResolver implements IExprVisitor<IToken[]> {
  public resolveExpr(expr: IExpr): IToken[] {
    return expr.accept(this);
  }
  // tslint:disable-next-line:variable-name
  public visitExprInvalid(_expr: InvalidExpr): IToken[] {
    return [];
  }
  public visitBinary(expr: BinaryExpr): IToken[] {
    return this.resolveExpr(expr.left)
      .concat(this.resolveExpr(expr.right));
  }
  public visitUnary(expr: UnaryExpr): IToken[] {
    return this.resolveExpr(expr.factor)
      .concat(this.resolveExpr(expr.factor));
  }
  public visitFactor(expr: FactorExpr): IToken[] {
    return this.resolveExpr(expr.suffix)
      .concat(this.resolveExpr(expr.exponent));
  }
  public visitSuffix(expr: SuffixExpr): IToken[] {
    return this.resolveExpr(expr.suffix)
      .concat(this.resolveExpr(expr.trailer));
  }
  public visitCall(expr: CallExpr): IToken[] {
    return this.resolveExpr(expr.callee)
      .concat(...expr.args.map(arg => this.resolveExpr(arg)));
  }
  public visitArrayIndex(expr: ArrayIndexExpr): IToken[] {
    return this.resolveExpr(expr.array);
  }
  public visitArrayBracket(expr: ArrayBracketExpr): IToken[] {
    return this.resolveExpr(expr.array)
      .concat(this.resolveExpr(expr.index));
  }
  public visitDelegate(expr: DelegateExpr): IToken[] {
    return this.resolveExpr(expr.variable);
  }
  // tslint:disable-next-line:variable-name
  public visitLiteral(_expr: LiteralExpr): IToken[] {
    return [];
  }
  public visitVariable(expr: VariableExpr): IToken[] {
    return [expr.token];
  }
  public visitGrouping(expr: GroupingExpr): IToken[] {
    return this.resolveExpr(expr.expr);
  }
  // tslint:disable-next-line:variable-name
  public visitAnonymousFunction(_expr: AnonymousFunctionExpr): IToken[] {
    return [];
  }
}
