import { IExprVisitor, IExpr } from '../parser/types';
import {
  BinaryExpr, UnaryExpr, FactorExpr, SuffixExpr,
  CallExpr, ArrayIndexExpr, ArrayBracketExpr, DelegateExpr,
  LiteralExpr, VariableExpr, GroupingExpr, AnonymousFunctionExpr,
  InvalidExpr,
} from '../parser/expr';
import { ILocalResult } from './types';

export class LocalResolver implements IExprVisitor<ILocalResult[]> {
  public resolveExpr(expr: IExpr): ILocalResult[] {
    return expr.accept(this);
  }
  // tslint:disable-next-line:variable-name
  public visitExprInvalid(_expr: InvalidExpr): ILocalResult[] {
    return [];
  }
  public visitBinary(expr: BinaryExpr): ILocalResult[] {
    return this.resolveExpr(expr.left)
      .concat(this.resolveExpr(expr.right));
  }
  public visitUnary(expr: UnaryExpr): ILocalResult[] {
    return this.resolveExpr(expr.factor);
  }
  public visitFactor(expr: FactorExpr): ILocalResult[] {
    return this.resolveExpr(expr.suffix)
      .concat(this.resolveExpr(expr.exponent));
  }
  public visitSuffix(expr: SuffixExpr): ILocalResult[] {
    return this.resolveExpr(expr.suffix)
      .concat(this.resolveExpr(expr.trailer));
  }
  public visitCall(expr: CallExpr): ILocalResult[] {
    if (expr.isTrailer) {
      if (expr.args.length === 0) {
        return [];
      }

      return expr.args.reduce(
        (acc, curr) => acc.concat(this.resolveExpr(curr)),
        [] as ILocalResult[]);
    }

    return this.resolveExpr(expr.callee)
      .concat(...expr.args.map(arg => this.resolveExpr(arg)));
  }
  public visitArrayIndex(expr: ArrayIndexExpr): ILocalResult[] {
    return expr.isTrailer ? [] : this.resolveExpr(expr.array);
  }
  public visitArrayBracket(expr: ArrayBracketExpr): ILocalResult[] {
    return expr.isTrailer
      ? this.resolveExpr(expr.index)
      : this.resolveExpr(expr.array).concat(this.resolveExpr(expr.index));
  }
  public visitDelegate(expr: DelegateExpr): ILocalResult[] {
    return expr.isTrailer ? [] : this.resolveExpr(expr.variable);
  }
  // tslint:disable-next-line:variable-name
  public visitLiteral(_expr: LiteralExpr): ILocalResult[] {
    return [];
  }
  public visitVariable(expr: VariableExpr): ILocalResult[] {
    return expr.isTrailer ? [] : [{ expr, token: expr.token }];
  }
  public visitGrouping(expr: GroupingExpr): ILocalResult[] {
    return this.resolveExpr(expr.expr);
  }
  // tslint:disable-next-line:variable-name
  public visitAnonymousFunction(_expr: AnonymousFunctionExpr): ILocalResult[] {
    return [];
  }
}
