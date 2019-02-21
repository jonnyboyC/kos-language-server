import { IExprVisitor, IExpr, ISuffixTerm, ISuffixTermVisitor } from '../parser/types';
import * as Expr from '../parser/expr';
import * as SuffixTerm from '../parser/suffixTerm';
import { LocalResolver } from './localResolver';
import { ISetResolverResult, ILocalResult } from './types';
import { setResult } from './setResult';
import { empty } from '../utilities/typeGuards';

export class SetResolver implements
  IExprVisitor<ISetResolverResult>,
  ISuffixTermVisitor<ISetResolverResult> {

  public constructor(public readonly localResolver: LocalResolver) {
  }

  public resolveExpr(expr: IExpr): ISetResolverResult {
    return expr.accept(this);
  }
  public resolveSuffixTerm(suffixTerm: ISuffixTerm): ISetResolverResult {
    return suffixTerm.accept(this);
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
    const result = this.resolveSuffixTerm(expr.suffixTerm);
    if (empty(expr.trailer)) {
      return setResult(result.set, result.used);
    }

    if (expr.trailer.tag === 'expr') {
      return setResult(result.set, result.used, this.localResolver.resolveExpr(expr.trailer));
    }

    return setResult(result.set, result.used, this.localResolver.resolveSuffixTerm(expr.trailer));
  }
  public visitSuffixTerm(expr: SuffixTerm.SuffixTerm): ISetResolverResult {
    const result = this.resolveSuffixTerm(expr.atom);
    if (expr.trailers.length === 0) {
      return setResult(result.set, result.used);
    }

    return setResult(result.set, result.used, expr.trailers.reduce(
      (acc, curr) => acc.concat(this.localResolver.resolveSuffixTerm(curr)),
      [] as ILocalResult[]));
  }
  public visitCall(_: SuffixTerm.Call): ISetResolverResult {
    return setResult();
  }
  public visitArrayIndex(_: SuffixTerm.ArrayIndex): ISetResolverResult {
    return setResult();
  }
  public visitArrayBracket(_: SuffixTerm.ArrayBracket): ISetResolverResult {
    return setResult();
  }
  public visitDelegate(_: SuffixTerm.Delegate): ISetResolverResult {
    return setResult();
  }
  public visitLiteral(_: SuffixTerm.Literal): ISetResolverResult {
    return setResult();
  }
  public visitIdentifier(expr: SuffixTerm.Identifier): ISetResolverResult {
    return setResult(expr.token);
  }
  public visitGrouping(_: SuffixTerm.Grouping): ISetResolverResult {
    return setResult();
  }
  public visitAnonymousFunction(_: Expr.AnonymousFunction): ISetResolverResult {
    return setResult();
  }
}
