import { TreeNode } from './types';
import * as Decl from './declare';
import * as Stmt from './stmt';
import * as Expr from './expr';
import * as SuffixTerm from './suffixTerm';
import { Token } from '../entities/token';
import { TreeExecute } from './treeExecute';
import { flatten } from '../utilities/arrayUtils';
import { IToken } from '../entities/types';

/**
 * Check all tokens in a given tree node
 */
export class TokenCheck extends TreeExecute<IToken[]> {

  /**
   * Construct token check
   */
  constructor() {
    super();
  }

  /**
   * Get all tokens in the syntax tree from this node down
   * @param syntaxNode syntax node to begin
   */
  public orderedTokens(syntaxNode: TreeNode): IToken[] {
    return this.nodeAction(syntaxNode);
  }

  /**
   * Add tokens from each internal node
   * @param node syntax node to begin
   */
  protected nodeAction(node: TreeNode): IToken[] {
    // return result if token found
    if (node instanceof Token) {
      return [node];
    }

    const tokens: IToken[][] = [];

    for (const childNode of node.ranges) {
      if (childNode instanceof SuffixTerm.SuffixTermBase) {
        tokens.push(this.suffixTermAction(childNode));
      } else if (childNode instanceof Expr.Expr) {
        tokens.push(this.exprAction(childNode));
      } else if (childNode instanceof Stmt.Stmt) {
        tokens.push(this.stmtAction(childNode));
      } else if (childNode instanceof Decl.Param) {
        const params = [];
        for (const param of childNode.requiredParameters) {
          params.push(param.identifier);
        }

        for (const param of childNode.optionalParameters) {
          params.push(param.identifier);
          params.push(param.toIs);
          params.push(...this.exprAction(param.value));
        }

        tokens.push(params);
      }
    }

    return flatten(tokens);
  }
}
