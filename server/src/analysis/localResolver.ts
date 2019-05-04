import {
  IExprVisitor,
  IExpr,
  ISuffixTerm,
  ISuffixTermVisitor,
} from '../parser/types';
import * as Expr from '../parser/expr';
import * as SuffixTerm from '../parser/suffixTerm';
import { ILocalResult } from './types';
import { empty } from '../utilities/typeGuards';

/**
 * Identify all local identifiers in a provided expression
 */
export class LocalResolver
  implements IExprVisitor<ILocalResult[]>, ISuffixTermVisitor<ILocalResult[]> {

  /**
   * Are we currently looking at a suffix trailer
   */
  private isTrailer: boolean;

  /**
   * local resolver constructor
   */
  constructor() {
    this.isTrailer = false;
  }

  /**
   * resolve local identifiers in expression
   * @param expr expression
   */
  public resolveExpr(expr: IExpr): ILocalResult[] {
    return expr.accept(this);
  }

  /**
   * resolve a suffix term
   * @param suffixTerm suffix term
   */
  public resolveSuffixTerm(suffixTerm: ISuffixTerm): ILocalResult[] {
    return suffixTerm.accept(this);
  }

  /**
   * Visit an invalid expression
   * @param _ invalid expression
   */
  public visitExprInvalid(_: Expr.Invalid): ILocalResult[] {
    return [];
  }

  /**
   * Visit a binary expression
   * @param expr binary expression
   */
  public visitBinary(expr: Expr.Binary): ILocalResult[] {
    return this.resolveExpr(expr.left).concat(this.resolveExpr(expr.right));
  }

  /**
   * Visit a unary expression
   * @param expr unary expression
   */
  public visitUnary(expr: Expr.Unary): ILocalResult[] {
    return this.resolveExpr(expr.factor);
  }

  /**
   * Vist a factor
   * @param expr factor expression
   */
  public visitFactor(expr: Expr.Factor): ILocalResult[] {
    return this.resolveExpr(expr.suffix).concat(
      this.resolveExpr(expr.exponent),
    );
  }

  /**
   * Vist a suffix expression
   * @param expr suffix expression
   */
  public visitSuffix(expr: Expr.Suffix): ILocalResult[] {
    const atom = this.resolveSuffixTerm(expr.suffixTerm);
    if (empty(expr.trailer)) {
      return atom;
    }

    return atom.concat(this.resolveSuffixTerm(expr.trailer));
  }

  /**
   * Visit a lambda
   * @param _ lambda expression
   */
  public visitLambda(_: Expr.Lambda): ILocalResult[] {
    return [];
  }

  /**
   * Vist an invalid suffix term
   * @param _ invalid suffix term
   */
  public visitSuffixTermInvalid(_: SuffixTerm.Invalid): ILocalResult[] {
    return [];
  }

  /**
   * visit a suffix term trailer
   * @param suffixTerm suffix term trailer
   */
  public visitSuffixTrailer(
    suffixTerm: SuffixTerm.SuffixTrailer,
  ): ILocalResult[] {
    // indicate we're currently in a trailer
    return this.executeAs(true, () => {
      const atom = this.resolveSuffixTerm(suffixTerm.suffixTerm);

      return empty(suffixTerm.trailer)
        ? atom
        : atom.concat(this.resolveSuffixTerm(suffixTerm.trailer));
    });
  }

  /**
   * Visit a suffix term
   * @param suffixTerm suffix term
   */
  public visitSuffixTerm(suffixTerm: SuffixTerm.SuffixTerm): ILocalResult[] {
    const atom = this.resolveSuffixTerm(suffixTerm.atom);
    if (suffixTerm.trailers.length === 0) {
      return atom;
    }

    return atom.concat(
      suffixTerm.trailers.reduce(
        (acc, curr) => acc.concat(this.resolveSuffixTerm(curr)),
        [] as ILocalResult[],
      ),
    );
  }

  /**
   * Visit a call suffix term trailer
   * @param suffixTerm call trailer
   */
  public visitCall(suffixTerm: SuffixTerm.Call): ILocalResult[] {
    if (suffixTerm.args.length === 0) return [];

    // indicate args are not in a trailer
    return this.executeAs(false, () =>
      suffixTerm.args.reduce(
        (acc, curr) => acc.concat(this.resolveExpr(curr)),
        [] as ILocalResult[],
      ),
    );
  }

  /**
   * Visit an array index
   * @param _ array index trailer
   */
  public visitArrayIndex(_: SuffixTerm.ArrayIndex): ILocalResult[] {
    return [];
  }

  /**
   * Visit an array bracket
   * @param suffixTerm array bracket trailer
   */
  public visitArrayBracket(
    suffixTerm: SuffixTerm.ArrayBracket,
  ): ILocalResult[] {
    return this.executeAs(false, () => this.resolveExpr(suffixTerm.index));
  }

  /**
   * Visit a delegate
   * @param _ delgate trailer
   */
  public visitDelegate(_: SuffixTerm.Delegate): ILocalResult[] {
    return [];
  }

  /**
   * Visit a literal
   * @param _ literal suffix term
   */
  public visitLiteral(_: SuffixTerm.Literal): ILocalResult[] {
    return [];
  }

  /**
   * Visit an identifier
   * @param suffixTerm suffix term identifier
   */
  public visitIdentifier(suffixTerm: SuffixTerm.Identifier): ILocalResult[] {
    // if we're a trailer return nothing otherwise identifer
    return this.isTrailer
      ? []
      : [{ expr: suffixTerm, token: suffixTerm.token }];
  }

  /**
   * Visit a suffix term grouping
   * @param suffixTerm suffix term grouping
   */
  public visitGrouping(suffixTerm: SuffixTerm.Grouping): ILocalResult[] {
    return this.resolveExpr(suffixTerm.expr);
  }

  /**
   * Execute a node as either a trailer or not. This function
   * returns to it's previous state post execution
   * @param isTrailer is the function a trailer
   * @param func function to execute
   */
  private executeAs(isTrailer: boolean, func: () => ILocalResult[]) {
    const old = this.isTrailer;
    this.isTrailer = isTrailer;

    const result = func();

    this.isTrailer = old;
    return result;
  }
}
