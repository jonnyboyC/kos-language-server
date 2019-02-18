import { IExprVisitor, IExpr } from '../parser/types';
import * as Expr from '../parser/expr';
import { LocalResolver } from './localResolver';
import { ISetResolverResult, ILocalResult } from './types';
import { setResult } from './setResult';
import { empty } from '../utilities/typeGuards';

export class SetResolver implements IExprVisitor<ISetResolverResult> {

  public constructor(public readonly localResolver: LocalResolver) {
  }

  public resolveExpr(expr: IExpr): ISetResolverResult {
    return expr.accept(this);
  }
  public visitExprInvalid(_: Expr.Invalid): ISetResolverResult {
    return setResult();
  }
  public visitBinary(_: Expr.Binary): ISetResolverResult {
    return setResult();
  }
  public visitUnary(_: Expr.Unary): ISetResolverResult {
    return setResult();
  }
  public visitFactor(_: Expr.Factor): ISetResolverResult {
    return setResult();
  }
  public visitSuffix(expr: Expr.Suffix): ISetResolverResult {
    const result = this.resolveExpr(expr.suffixTerm);
    if (empty(expr.trailer)) {
      return setResult(result.set, result.used);
    }

    return setResult(result.set, result.used, this.localResolver.resolveExpr(expr.trailer));
  }
  public visitSuffixTerm(expr: Expr.SuffixTerm): ISetResolverResult {
    const result = this.resolveExpr(expr.atom);
    if (expr.trailers.length === 0) {
      return setResult(result.set, result.used);
    }

    return setResult(result.set, result.used, expr.trailers.reduce(
      (acc, curr) => acc.concat(this.localResolver.resolveExpr(curr)),
      [] as ILocalResult[]));
  }
  public visitCall(_: Expr.Call): ISetResolverResult {
    return setResult();
  }
  public visitArrayIndex(_: Expr.ArrayIndex): ISetResolverResult {
    return setResult();
  }
  public visitArrayBracket(_: Expr.ArrayBracket): ISetResolverResult {
    return setResult();
  }
  public visitDelegate(_: Expr.Delegate): ISetResolverResult {
    return setResult();
  }
  public visitLiteral(_: Expr.Literal): ISetResolverResult {
    return setResult();
  }
  public visitVariable(expr: Expr.Identifier): ISetResolverResult {
    return setResult(expr.token);
  }
  public visitGrouping(_: Expr.Grouping): ISetResolverResult {
    return setResult();
  }
  public visitAnonymousFunction(_: Expr.AnonymousFunction): ISetResolverResult {
    return setResult();
  }
}
