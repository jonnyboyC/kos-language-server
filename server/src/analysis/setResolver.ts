import { IExprVisitor, IExpr, ISuffixTerm, ISuffixTermVisitor } from '../parser/types';
import * as Expr from '../parser/expr';
import * as SuffixTerm from '../parser/suffixTerm';
import { LocalResolver } from './localResolver';
import { ISetResolverResult } from './types';
import { setResult } from './setResult';
import { empty } from '../utilities/typeGuards';
import { IToken } from '../entities/types';

/**
 * Identify all local sybmbols used and all used symbols
 */
export class SetResolver implements
  IExprVisitor<ISetResolverResult>,
  ISuffixTermVisitor<ISetResolverResult> {

  /**
   * Set resolver constructor
   */
  public constructor(public readonly localResolver: LocalResolver) {
  }

  /**
   * Resolve expression
   * @param expr expression to resolve
   */
  public resolveExpr(expr: IExpr): ISetResolverResult {
    return expr.accept(this);
  }

  /**
   * Resolve suffix term
   * @param suffixTerm suffix term to resolve
   */
  public resolveSuffixTerm(suffixTerm: ISuffixTerm): ISetResolverResult {
    return suffixTerm.accept(this);
  }

  /**
   * Resolve invalid expression, i.e. do nothing
   * @param _ invalid expression
   */
  public visitExprInvalid(_: Expr.Invalid): ISetResolverResult {
    return setResult();
  }

  /**
   * Resolve binary expresiosn. Binary expression cannot be set
   * @param _ binary expression
   */
  public visitBinary(_: Expr.Binary): ISetResolverResult {
    return setResult();
  }

  /**
   * Resolve unary expression. Unary expression cannot be set
   * @param _ unary expression
   */
  public visitUnary(_: Expr.Unary): ISetResolverResult {
    return setResult();
  }

  /**
   * Resolve factor expression. Factor cannot be set.
   * @param _ factor expression
   */
  public visitFactor(_: Expr.Factor): ISetResolverResult {
    return setResult();
  }

  /**
   * Resolve suffix expression.
   * @param expr suffix expression
   */
  public visitSuffix(expr: Expr.Suffix): ISetResolverResult {
    const result = this.resolveSuffixTerm(expr.suffixTerm);
    if (empty(expr.trailer)) {
      return setResult(result.set, result.used);
    }

    return setResult(result.set, result.used, this.localResolver.resolveSuffixTerm(expr.trailer));
  }

  /**
   * Resolve lambda expression. Lambda cannot be set
   * @param _ lambda expression
   */
  public visitLambda(_: Expr.Lambda): ISetResolverResult {
    return setResult();
  }

  /**
   * Resolve invalid suffix term. i.e. do nothing
   * @param _ invalid suffix term
   */
  public visitSuffixTermInvalid(_: SuffixTerm.Invalid): ISetResolverResult {
    throw setResult();
  }

  /**
   * Resolve suffix term trailer
   * @param expr suffix term trailer
   */
  public visitSuffixTrailer(expr: SuffixTerm.SuffixTrailer): ISetResolverResult {
    const result = this.resolveSuffixTerm(expr.suffixTerm);
    if (empty(expr.trailer)) {
      return setResult(result.set, result.used);
    }

    return setResult(result.set, result.used, this.localResolver.resolveSuffixTerm(expr.trailer));
  }

  /**
   * Resolve suffix term
   * @param expr suffix term
   */
  public visitSuffixTerm(expr: SuffixTerm.SuffixTerm): ISetResolverResult {
    const result = this.resolveSuffixTerm(expr.atom);
    if (expr.trailers.length === 0) {
      return setResult(result.set, result.used);
    }

    return setResult(result.set, result.used, expr.trailers.reduce(
      (acc, curr) => acc.concat(this.localResolver.resolveSuffixTerm(curr)),
      [] as IToken[]));
  }

  /**
   * Resolve suffix term call trailer
   * @param _ suffix term call trailer
   */
  public visitCall(_: SuffixTerm.Call): ISetResolverResult {
    return setResult();
  }

  /**
   * Resolve array index trailer
   * @param _ suffix term array index trailer
   */
  public visitArrayIndex(_: SuffixTerm.ArrayIndex): ISetResolverResult {
    return setResult();
  }

  /**
   * Resolve array bracket trailer
   * @param _ suffix term array bracket trailer
   */
  public visitArrayBracket(_: SuffixTerm.ArrayBracket): ISetResolverResult {
    return setResult();
  }

  /**
   * Resolve delegate trailer
   * @param _ suffix term delegate
   */
  public visitDelegate(_: SuffixTerm.Delegate): ISetResolverResult {
    return setResult();
  }

  /**
   * Resolve literal
   * @param _ literal
   */
  public visitLiteral(_: SuffixTerm.Literal): ISetResolverResult {
    return setResult();
  }

  /**
   * Resolve identifier
   * @param expr identifier suffix term
   */
  public visitIdentifier(expr: SuffixTerm.Identifier): ISetResolverResult {
    return setResult(expr.token);
  }

  /**
   * Resolve grouping suffix term. Grouping cannot be set
   * @param _ grouping suffix term
   */
  public visitGrouping(_: SuffixTerm.Grouping): ISetResolverResult {
    return setResult();
  }
}
