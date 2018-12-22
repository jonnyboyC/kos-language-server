import { IExprVisitor, IExpr } from '../parser/types';
import { BinaryExpr, UnaryExpr, FactorExpr, SuffixExpr,
  CallExpr, ArrayIndexExpr, ArrayBracketExpr, DelegateExpr,
  LiteralExpr, VariableExpr, GroupingExpr, AnonymousFunctionExpr } from '../parser/expr';
import { IToken } from '../entities/types';

export class SetResolver implements IExprVisitor<Maybe<IToken>> {
  public resolveExpr(expr: IExpr): Maybe<IToken> {
    return expr.accept(this);
  }
  // tslint:disable-next-line:variable-name
  public visitBinary(_expr: BinaryExpr): Maybe<IToken> {
    return undefined;
  }
  // tslint:disable-next-line:variable-name
  public visitUnary(_expr: UnaryExpr): Maybe<IToken> {
    return undefined;
  }
  // tslint:disable-next-line:variable-name
  public visitFactor(_expr: FactorExpr): Maybe<IToken> {
    return undefined;
  }
  public visitSuffix(expr: SuffixExpr): Maybe<IToken> {
    return this.resolveExpr(expr.suffix);
  }
  // tslint:disable-next-line:variable-name
  public visitCall(_expr: CallExpr): Maybe<IToken> {
    return undefined;
  }
  public visitArrayIndex(expr: ArrayIndexExpr): Maybe<IToken> {
    return this.resolveExpr(expr.array);
  }
  public visitArrayBracket(expr: ArrayBracketExpr): Maybe<IToken> {
    return this.resolveExpr(expr.array);
  }
  public visitDelegate(expr: DelegateExpr): Maybe<IToken> {
    return this.resolveExpr(expr.variable);
  }
  // tslint:disable-next-line:variable-name
  public visitLiteral(_expr: LiteralExpr): Maybe<IToken> {
    return undefined;
  }
  public visitVariable(expr: VariableExpr): Maybe<IToken> {
    return expr.token;
  }
  public visitGrouping(expr: GroupingExpr): Maybe<IToken> {
    return this.resolveExpr(expr.expr);
  }
  // tslint:disable-next-line:variable-name
  public visitAnonymousFunction(_expr: AnonymousFunctionExpr): Maybe<IToken> {
    return undefined;
  }
}
