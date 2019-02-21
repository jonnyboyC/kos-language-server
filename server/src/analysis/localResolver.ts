import { IExprVisitor, IExpr, ISuffixTerm } from '../parser/types';
import * as Expr from '../parser/expr';
import * as SuffixTerm from '../parser/suffixTerm';
import { ILocalResult } from './types';
import { empty } from '../utilities/typeGuards';

export class LocalResolver implements IExprVisitor<ILocalResult[]> {
  public resolveExpr(expr: IExpr): ILocalResult[] {
    return expr.accept(this);
  }
  public resolveSuffixTerm(suffixTerm: ISuffixTerm): ILocalResult[] {
    return suffixTerm.accept(this);
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
    const atom = this.resolveSuffixTerm(expr.suffixTerm);
    if (empty(expr.trailer)) {
      return atom;
    }

    if (expr.trailer.tag === 'expr') {
      return atom.concat(this.resolveExpr(expr.trailer));
    }
    return atom.concat(this.resolveSuffixTerm(expr.trailer));
  }
  public visitAnonymousFunction(_: Expr.AnonymousFunction): ILocalResult[] {
    return [];
  }
  public visitSuffixTerm(expr: SuffixTerm.SuffixTerm): ILocalResult[] {
    const atom = this.resolveSuffixTerm(expr.atom);
    if (expr.trailers.length === 0) {
      return atom;
    }

    return atom.concat(expr.trailers.reduce(
      (acc, curr) => acc.concat(this.resolveSuffixTerm(curr)),
      [] as ILocalResult[]));
  }
  public visitCall(expr: SuffixTerm.Call): ILocalResult[] {
    if (expr.args.length === 0) return [];

    return expr.args.reduce(
      (acc, curr) => acc.concat(this.resolveExpr(curr)),
      [] as ILocalResult[]);
  }
  public visitArrayIndex(_: SuffixTerm.ArrayIndex): ILocalResult[] {
    return [];
  }
  public visitArrayBracket(expr: SuffixTerm.ArrayBracket): ILocalResult[] {
    return this.resolveExpr(expr.index);
  }
  public visitDelegate(_: SuffixTerm.Delegate): ILocalResult[] {
    return [];
  }
  public visitLiteral(_: SuffixTerm.Literal): ILocalResult[] {
    return [];
  }
  public visitIdentifier(expr: SuffixTerm.Identifier): ILocalResult[] {
    return expr.isTrailer ? [] : [{ expr, token: expr.token }];
  }
  public visitGrouping(expr: SuffixTerm.Grouping): ILocalResult[] {
    return this.resolveExpr(expr.expr);
  }
}
