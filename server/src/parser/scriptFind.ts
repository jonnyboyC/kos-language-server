import { IFindResult, TreeNode } from './types';
import * as Decl from './models/declare';
import * as Stmt from './models/stmt';
import * as Expr from './models/expr';
import * as SuffixTerm from './models/suffixTerm';
import { Position } from 'vscode-languageserver';
import { binarySearch, rangeContainsPos } from '../utilities/positionUtils';
import { empty } from '../utilities/typeGuards';
import { Token } from '../models/token';
import { TreeExecute } from '../utilities/treeExecute';

export type AstContext =
  | Constructor<Expr.Expr>
  | Constructor<Stmt.Stmt>
  | Constructor<SuffixTerm.SuffixTermBase>
  | Constructor<Decl.Parameter>;

export class ScriptFind extends TreeExecute<Maybe<IFindResult>> {
  private pos: Position;
  private contexts: AstContext[];

  constructor() {
    super();
    this.pos = {
      line: 0,
      character: 0,
    };
    this.contexts = [];
  }

  /**
   * Find a token within a tree node
   * @param syntaxNode node to search in
   * @param pos position to find
   * @param contexts list of contexts to captures
   */
  public find(
    syntaxNode: TreeNode,
    pos: Position,
    ...contexts: AstContext[]
  ): Maybe<IFindResult> {
    this.pos = pos;
    this.contexts = contexts;
    return this.nodeAction(syntaxNode);
  }

  protected nodeAction(node: TreeNode): Maybe<IFindResult> {
    const searchResult = binarySearch(node.ranges, this.pos);
    if (empty(searchResult)) {
      return searchResult;
    }

    // search expression if expression
    if (searchResult instanceof SuffixTerm.SuffixTermBase) {
      const findResult = this.suffixTermAction(searchResult);

      // add context if not set yet
      if (!empty(findResult) && this.addContext(findResult, node)) {
        findResult.node = node;
      }

      return findResult;
    }

    // search expression if expression
    if (searchResult instanceof Expr.Expr) {
      const findResult = this.exprAction(searchResult);

      // add context if not set yet
      if (!empty(findResult) && this.addContext(findResult, node)) {
        findResult.node = node;
      }

      return findResult;
    }

    // search statement if statement
    if (searchResult instanceof Stmt.Stmt) {
      const findResult = this.stmtAction(searchResult);

      // add context if not set yet
      if (!empty(findResult) && this.addContext(findResult, node)) {
        findResult.node = node;
      }

      return findResult;
    }

    // search an optional parameter
    if (searchResult instanceof Decl.DefaultParam) {
      if (rangeContainsPos(searchResult.identifier, this.pos)) {
        return {
          token: searchResult.identifier,
          node: this.isContext(node)
            ? node
            : this.isContext(searchResult)
            ? searchResult
            : undefined,
        };
      }
      if (rangeContainsPos(searchResult.value, this.pos)) {
        return this.exprAction(searchResult.value);
      }

      return undefined;
    }

    // search a normal parameter
    if (searchResult instanceof Decl.Parameter) {
      return {
        node: this.isContext(node)
          ? node
          : this.isContext(searchResult)
          ? searchResult
          : undefined,
        token: searchResult.identifier,
      };
    }

    // return result if token found
    if (searchResult instanceof Token) {
      return {
        node: this.isContext(node) ? node : undefined,
        token: searchResult,
      };
    }

    // return result if token found
    if (searchResult instanceof Decl.Scope) {
      if (
        !empty(searchResult.scope) &&
        rangeContainsPos(searchResult.scope, this.pos)
      ) {
        return {
          node: undefined,
          token: searchResult.scope,
        };
      }

      if (
        !empty(searchResult.declare) &&
        rangeContainsPos(searchResult.declare, this.pos)
      ) {
        return {
          node: undefined,
          token: searchResult.declare,
        };
      }
    }

    throw new Error('Unexpected result found.');
  }

  private addContext(findResult: IFindResult, node: TreeNode): boolean {
    return empty(findResult.node) && this.isContext(node);
  }

  // is the correct context
  private isContext(node: TreeNode): boolean {
    return this.contexts.some(context => node instanceof context);
  }
}
