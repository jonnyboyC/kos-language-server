import { IExprVisitor, IExpr } from '../parser/types';
import {
  BinaryExpr, UnaryExpr, FactorExpr, SuffixExpr,
  CallExpr, ArrayIndexExpr, ArrayBracketExpr, DelegateExpr,
  LiteralExpr, VariableExpr, GroupingExpr, AnonymousFunctionExpr,
  InvalidExpr,
} from '../parser/expr';
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
  public visitExprInvalid(_expr: InvalidExpr): ISetResolverResult {
    return setResult();
  }
  // tslint:disable-next-line:variable-name
  public visitBinary(_expr: BinaryExpr): ISetResolverResult {
    return setResult();
  }
  // tslint:disable-next-line:variable-name
  public visitUnary(_expr: UnaryExpr): ISetResolverResult {
    return setResult();
  }
  // tslint:disable-next-line:variable-name
  public visitFactor(_expr: FactorExpr): ISetResolverResult {
    return setResult();
  }
  public visitSuffix(expr: SuffixExpr): ISetResolverResult {
    const result = this.resolveExpr(expr.suffix);
    return setResult(result.set, result.used, this.localResolver.resolveExpr(expr.trailer));
  }
  // tslint:disable-next-line:variable-name
  public visitCall(_expr: CallExpr): ISetResolverResult {
    return setResult();
  }
  public visitArrayIndex(expr: ArrayIndexExpr): ISetResolverResult {
    const result = this.resolveExpr(expr.array);

    // TODO this isn't constrained correctly
    return setResult(result.set, result.used);
  }
  public visitArrayBracket(expr: ArrayBracketExpr): ISetResolverResult {
    const result = this.resolveExpr(expr.array);
    return setResult(result.set, result.used, this.localResolver.resolveExpr(expr.index));
  }
  public visitDelegate(expr: DelegateExpr): ISetResolverResult {
    return this.resolveExpr(expr.variable);
  }
  // tslint:disable-next-line:variable-name
  public visitLiteral(_expr: LiteralExpr): ISetResolverResult {
    return setResult();
  }
  public visitVariable(expr: VariableExpr): ISetResolverResult {
    return setResult(expr.token);
  }
  // tslint:disable-next-line:variable-name
  public visitGrouping(_expr: GroupingExpr): ISetResolverResult {
    return setResult();
  }
  // tslint:disable-next-line:variable-name
  public visitAnonymousFunction(_expr: AnonymousFunctionExpr): ISetResolverResult {
    return setResult();
  }
}
