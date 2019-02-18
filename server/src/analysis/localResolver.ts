import { IExprVisitor, IExpr } from '../parser/types';
import * as Expr from '../parser/expr';
import { ILocalResult } from './types';

export class LocalResolver implements IExprVisitor<ILocalResult[]> {
  public resolveExpr(expr: IExpr): ILocalResult[] {
    return expr.accept(this);
  }
  // tslint:disable-next-line:variable-name
  public visitExprInvalid(_expr: Expr.Invalid): ILocalResult[] {
    return [];
  }
  public visitBinary(expr: Expr.Binary): ILocalResult[] {
    return this.resolveExpr(expr.left)
      .concat(this.resolveExpr(expr.right));
  }
  public visitUnary(expr: Expr.Unary): ILocalResult[] {
    return this.resolveExpr(expr.factor);
  }
  public visitFactor(expr: Expr.Factor): ILocalResult[] {
    return this.resolveExpr(expr.suffix)
      .concat(this.resolveExpr(expr.exponent));
  }
  public visitSuffix(expr: Expr.Suffix): ILocalResult[] {
    return this.resolveExpr(expr.base)
      .concat(this.resolveExpr(expr.trailer));
  }
  public visitCall(expr: Expr.Call): ILocalResult[] {
    if (expr.isTrailer) {
      if (expr.args.length === 0) {
        return [];
      }

      return expr.args.reduce(
        (acc, curr) => acc.concat(this.resolveExpr(curr)),
        [] as ILocalResult[]);
    }

    return this.resolveExpr(expr.base)
      .concat(...expr.args.map(arg => this.resolveExpr(arg)));
  }
  public visitArrayIndex(expr: Expr.ArrayIndex): ILocalResult[] {
    return expr.isTrailer ? [] : this.resolveExpr(expr.base);
  }
  public visitArrayBracket(expr: Expr.ArrayBracket): ILocalResult[] {
    return expr.isTrailer
      ? this.resolveExpr(expr.index)
      : this.resolveExpr(expr.base).concat(this.resolveExpr(expr.index));
  }
  public visitDelegate(expr: Expr.Delegate): ILocalResult[] {
    return expr.isTrailer ? [] : this.resolveExpr(expr.base);
  }
  // tslint:disable-next-line:variable-name
  public visitLiteral(_expr: Expr.Literal): ILocalResult[] {
    return [];
  }
  public visitVariable(expr: Expr.Variable): ILocalResult[] {
    return expr.isTrailer ? [] : [{ expr, token: expr.token }];
  }
  public visitGrouping(expr: Expr.Grouping): ILocalResult[] {
    return this.resolveExpr(expr.expr);
  }
  // tslint:disable-next-line:variable-name
  public visitAnonymousFunction(_expr: Expr.AnonymousFunction): ILocalResult[] {
    return [];
  }
}
