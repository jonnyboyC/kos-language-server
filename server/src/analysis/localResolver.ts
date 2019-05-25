import {
  IExprVisitor,
  IExpr,
  ISuffixTerm,
  ISuffixTermVisitor,
} from '../parser/types';
import * as Expr from '../parser/expr';
import * as SuffixTerm from '../parser/suffixTerm';
import { empty } from '../utilities/typeGuards';
import { IToken } from '../entities/types';

/**
 * Identify all local identifiers in a provided expression
 */
export class LocalResolver
  implements IExprVisitor<IToken[]>, ISuffixTermVisitor<IToken[]> {
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
  public resolveExpr(expr: IExpr): IToken[] {
    return expr.accept(this);
  }

  /**
   * resolve a suffix term
   * @param suffixTerm suffix term
   */
  public resolveSuffixTerm(suffixTerm: ISuffixTerm): IToken[] {
    return suffixTerm.accept(this);
  }

  /**
   * Visit an invalid expression
   * @param _ invalid expression
   */
  public visitExprInvalid(_: Expr.Invalid): IToken[] {
    return [];
  }

  /**
   * Visit a binary expression
   * @param expr binary expression
   */
  public visitBinary(expr: Expr.Binary): IToken[] {
    const tokens = this.resolveExpr(expr.left);
    tokens.push(...this.resolveExpr(expr.right));
    return tokens;
  }

  /**
   * Visit a unary expression
   * @param expr unary expression
   */
  public visitUnary(expr: Expr.Unary): IToken[] {
    return this.resolveExpr(expr.factor);
  }

  /**
   * Vist a factor
   * @param expr factor expression
   */
  public visitFactor(expr: Expr.Factor): IToken[] {
    const tokens = this.resolveExpr(expr.suffix)
    tokens.push(...this.resolveExpr(expr.exponent));
    return tokens;
  }

  /**
   * Vist a suffix expression
   * @param expr suffix expression
   */
  public visitSuffix(expr: Expr.Suffix): IToken[] {
    const tokens = this.resolveSuffixTerm(expr.suffixTerm);
    if (!empty(expr.trailer)) {
      tokens.push(...this.resolveSuffixTerm(expr.trailer));
    }

    return tokens;
  }

  /**
   * Visit a lambda
   * @param _ lambda expression
   */
  public visitLambda(_: Expr.Lambda): IToken[] {
    return [];
  }

  /**
   * Vist an invalid suffix term
   * @param _ invalid suffix term
   */
  public visitSuffixTermInvalid(_: SuffixTerm.Invalid): IToken[] {
    return [];
  }

  /**
   * visit a suffix term trailer
   * @param suffixTerm suffix term trailer
   */
  public visitSuffixTrailer(suffixTerm: SuffixTerm.SuffixTrailer): IToken[] {
    // indicate we're currently in a trailer
    return this.executeAs(true, () => {
      const tokens = this.resolveSuffixTerm(suffixTerm.suffixTerm);

      if (!empty(suffixTerm.trailer)) {
        tokens.push(...this.resolveSuffixTerm(suffixTerm.trailer));
      }

      return tokens;
    });
  }

  /**
   * Visit a suffix term
   * @param suffixTerm suffix term
   */
  public visitSuffixTerm(suffixTerm: SuffixTerm.SuffixTerm): IToken[] {
    const tokens = this.resolveSuffixTerm(suffixTerm.atom);

    for (const trailer of suffixTerm.trailers) {
      tokens.push(...this.resolveSuffixTerm(trailer));
    }

    return tokens;
  }

  /**
   * Visit a call suffix term trailer
   * @param suffixTerm call trailer
   */
  public visitCall(suffixTerm: SuffixTerm.Call): IToken[] {
    if (suffixTerm.args.length === 0) return [];

    // indicate args are not in a trailer
    return this.executeAs(false, () => {
      const tokens: IToken[] = [];

      for (const arg of suffixTerm.args) {
        tokens.push(...this.resolveExpr(arg));
      }

      return tokens;
    });
  }

  /**
   * Visit an array index
   * @param _ array index trailer
   */
  public visitArrayIndex(_: SuffixTerm.ArrayIndex): IToken[] {
    return [];
  }

  /**
   * Visit an array bracket
   * @param suffixTerm array bracket trailer
   */
  public visitArrayBracket(suffixTerm: SuffixTerm.ArrayBracket): IToken[] {
    return this.executeAs(false, () => this.resolveExpr(suffixTerm.index));
  }

  /**
   * Visit a delegate
   * @param _ delgate trailer
   */
  public visitDelegate(_: SuffixTerm.Delegate): IToken[] {
    return [];
  }

  /**
   * Visit a literal
   * @param _ literal suffix term
   */
  public visitLiteral(_: SuffixTerm.Literal): IToken[] {
    return [];
  }

  /**
   * Visit an identifier
   * @param suffixTerm suffix term identifier
   */
  public visitIdentifier(suffixTerm: SuffixTerm.Identifier): IToken[] {
    // if we're a trailer return nothing otherwise identifer
    return this.isTrailer ? [] : [suffixTerm.token];
  }

  /**
   * Visit a suffix term grouping
   * @param suffixTerm suffix term grouping
   */
  public visitGrouping(suffixTerm: SuffixTerm.Grouping): IToken[] {
    return this.resolveExpr(suffixTerm.expr);
  }

  /**
   * Execute a node as either a trailer or not. This function
   * returns to it's previous state post execution
   * @param isTrailer is the function a trailer
   * @param func function to execute
   */
  private executeAs(isTrailer: boolean, func: () => IToken[]) {
    const old = this.isTrailer;
    this.isTrailer = isTrailer;

    const result = func();

    this.isTrailer = old;
    return result;
  }
}
