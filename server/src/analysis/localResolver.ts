import { IExprVisitor, IExpr, ISuffixTerm, ISuffixTermVisitor } from '../parser/types';
import * as Expr from '../parser/expr';
import * as SuffixTerm from '../parser/suffixTerm';
import { ILocalResult } from './types';
import { empty } from '../utilities/typeGuards';

export class LocalResolver implements
  IExprVisitor<ILocalResult[]>,
  ISuffixTermVisitor<ILocalResult[]> {

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

    return atom.concat(this.resolveSuffixTerm(expr.trailer));
  }
  public visitAnonymousFunction(_: Expr.AnonymousFunction): ILocalResult[] {
    return [];
  }
  public visitSuffixTermInvalid(_: SuffixTerm.Invalid): ILocalResult[] {
    return [];
  }
  public visitSuffixTrailer(suffixTerm: SuffixTerm.SuffixTrailer): ILocalResult[] {
    const atom = this.resolveSuffixTerm(suffixTerm.suffixTerm);
    if (empty(suffixTerm.trailer)) {
      return atom;
    }

    return atom.concat(this.resolveSuffixTerm(suffixTerm.trailer));
  }
  public visitSuffixTerm(suffixTerm: SuffixTerm.SuffixTerm): ILocalResult[] {
    const atom = this.resolveSuffixTerm(suffixTerm.atom);
    if (suffixTerm.trailers.length === 0) {
      return atom;
    }

    return atom.concat(suffixTerm.trailers.reduce(
      (acc, curr) => acc.concat(this.resolveSuffixTerm(curr)),
      [] as ILocalResult[]));
  }
  public visitCall(suffixTerm: SuffixTerm.Call): ILocalResult[] {
    if (suffixTerm.args.length === 0) return [];

    return suffixTerm.args.reduce(
      (acc, curr) => acc.concat(this.resolveExpr(curr)),
      [] as ILocalResult[]);
  }
  public visitArrayIndex(_: SuffixTerm.ArrayIndex): ILocalResult[] {
    return [];
  }
  public visitArrayBracket(suffixTerm: SuffixTerm.ArrayBracket): ILocalResult[] {
    return this.resolveExpr(suffixTerm.index);
  }
  public visitDelegate(_: SuffixTerm.Delegate): ILocalResult[] {
    return [];
  }
  public visitLiteral(_: SuffixTerm.Literal): ILocalResult[] {
    return [];
  }
  public visitIdentifier(suffixTerm: SuffixTerm.Identifier): ILocalResult[] {
    return suffixTerm.isTrailer ? [] : [{ expr: suffixTerm, token: suffixTerm.token }];
  }
  public visitGrouping(suffixTerm: SuffixTerm.Grouping): ILocalResult[] {
    return this.resolveExpr(suffixTerm.expr);
  }
}
