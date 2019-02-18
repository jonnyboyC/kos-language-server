import { IExprVisitor, IExpr } from '../parser/types';
import * as Expr from '../parser/expr';
import { ILocalResult } from './types';
import { empty } from '../utilities/typeGuards';

export class LocalResolver implements IExprVisitor<ILocalResult[]> {

  public resolveExpr(expr: IExpr): ILocalResult[] {
    return expr.accept(this);
  }
  public visitExprInvalid(_: Expr.Invalid): ILocalResult[] {
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
    if (empty(expr.trailer)) {
      return this.resolveExpr(expr.suffixTerm);
    }

    return this.resolveExpr(expr.suffixTerm)
      .concat(this.resolveExpr(expr.trailer));
  }
  public visitSuffixTerm(expr: Expr.SuffixTerm): ILocalResult[] {
    const atom = this.resolveExpr(expr.atom);
    if (expr.trailers.length === 0) {
      return atom;
    }

    return atom.concat(expr.trailers.reduce(
      (acc, curr) => acc.concat(this.resolveExpr(curr)),
      [] as ILocalResult[]));
  }
  public visitCall(expr: Expr.Call): ILocalResult[] {
    if (expr.args.length === 0) return [];

    return expr.args.reduce(
      (acc, curr) => acc.concat(this.resolveExpr(curr)),
      [] as ILocalResult[]);
  }
  public visitArrayIndex(_: Expr.ArrayIndex): ILocalResult[] {
    return [];
  }
  public visitArrayBracket(expr: Expr.ArrayBracket): ILocalResult[] {
    return this.resolveExpr(expr.index);
  }
  public visitDelegate(_: Expr.Delegate): ILocalResult[] {
    return [];
  }
  public visitLiteral(_: Expr.Literal): ILocalResult[] {
    return [];
  }
  public visitVariable(expr: Expr.Identifier): ILocalResult[] {
    return expr.isTrailer ? [] : [{ expr, token: expr.token }];
  }
  public visitGrouping(expr: Expr.Grouping): ILocalResult[] {
    return this.resolveExpr(expr.expr);
  }
  public visitAnonymousFunction(_: Expr.AnonymousFunction): ILocalResult[] {
    return [];
  }
}
