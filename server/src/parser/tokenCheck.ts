import { IScript, IStmt, IExpr, ISuffixTerm } from './types';
import { Token } from '../entities/token';
import { TreeTraverse } from './treeTraverse';

/**
 * Check all tokens in a given tree node
 */
export class TokenCheck extends TreeTraverse {
  private tokens: Token[];

  /**
   * Construct token check
   */
  constructor() {
    super();
    this.tokens = [];
  }

  /**
   * Get all tokens in the syntax tree from this node down
   * @param syntaxNode syntax node to begin
   */
  public orderedTokens(script: IScript): Token[] {
    this.tokens = [];
    for (const stmt of script.stmts) {
      this.stmtAction(stmt);
    }

    return this.tokens;
  }

  public stmtAction(stmt: IStmt) {
    for (const range of stmt.ranges) {
      if (range instanceof Token) {
        this.tokens.push(range);
      }
    }

    stmt.accept(this, []);
  }

  public exprAction(expr: IExpr) {
    for (const range of expr.ranges) {
      if (range instanceof Token) {
        this.tokens.push(range);
      }
    }

    expr.accept(this, []);
  }

  public suffixTermAction(suffixTerm: ISuffixTerm) {
    for (const range of suffixTerm.ranges) {
      if (range instanceof Token) {
        this.tokens.push(range);
      }
    }

    suffixTerm.accept(this, []);
  }
}
