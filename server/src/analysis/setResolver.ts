import { IExprVisitor, IExpr } from '../parser/types';
import * as Expr from '../parser/expr';
import { LocalResolver } from './localResolver';
import { ISetResolverResult } from './types';
import { setResult } from './setResult';

export class SetResolver implements IExprVisitor<ISetResolverResult> {
  public constructor(public readonly localResolver: LocalResolver) {
  }

  public resolveExpr(expr: IExpr): ISetResolverResult {
    return expr.accept(this);
  }
  // tslint:disable-next-line:variable-name
  public visitExprInvalid(_expr: Expr.Invalid): ISetResolverResult {
    return setResult();
  }
  // tslint:disable-next-line:variable-name
  public visitBinary(_expr: Expr.Binary): ISetResolverResult {
    return setResult();
  }
  // tslint:disable-next-line:variable-name
  public visitUnary(_expr: Expr.Unary): ISetResolverResult {
    return setResult();
  }
  // tslint:disable-next-line:variable-name
  public visitFactor(_expr: Expr.Factor): ISetResolverResult {
    return setResult();
  }
  public visitSuffix(expr: Expr.Suffix): ISetResolverResult {
    const result = this.resolveExpr(expr.base);
    return setResult(result.set, result.used, this.localResolver.resolveExpr(expr.trailer));
  }
  // tslint:disable-next-line:variable-name
  public visitCall(_expr: Expr.Call): ISetResolverResult {
    return setResult();
  }
  public visitArrayIndex(expr: Expr.ArrayIndex): ISetResolverResult {
    const result = this.resolveExpr(expr.base);

    // TODO this isn't constrained correctly
    return setResult(result.set, result.used);
  }
  public visitArrayBracket(expr: Expr.ArrayBracket): ISetResolverResult {
    const result = this.resolveExpr(expr.base);
    return setResult(result.set, result.used, this.localResolver.resolveExpr(expr.index));
  }
  public visitDelegate(expr: Expr.Delegate): ISetResolverResult {
    return this.resolveExpr(expr.base);
  }
  // tslint:disable-next-line:variable-name
  public visitLiteral(_expr: Expr.Literal): ISetResolverResult {
    return setResult();
  }
  public visitVariable(expr: Expr.Variable): ISetResolverResult {
    return setResult(expr.token);
  }
  // tslint:disable-next-line:variable-name
  public visitGrouping(_expr: Expr.Grouping): ISetResolverResult {
    return setResult();
  }
  // tslint:disable-next-line:variable-name
  public visitAnonymousFunction(_expr: Expr.AnonymousFunction): ISetResolverResult {
    return setResult();
  }
}
