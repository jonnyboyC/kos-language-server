import { IFindResult, TreeNode } from './types';
import * as Decl from './declare';
import * as Inst from './inst';
import * as Expr from './expr';
import * as SuffixTerm from './suffixTerm';
import { Position } from 'vscode-languageserver';
import { binarySearch } from '../utilities/positionUtils';
import { empty } from '../utilities/typeGuards';
import { Token } from '../entities/token';
import { TraverseTree } from './traverseTree';

type Contexts = Constructor<Expr.Expr>
  | Constructor<Inst.Inst>
  | Constructor<SuffixTerm.SuffixTermBase>
  | Constructor<Decl.Parameter>;

export class ScriptFind extends TraverseTree<Maybe<IFindResult>> {

  private pos: Position;
  private contexts: Contexts[];

  constructor() {
    super();
    this.pos = {
      line: 0,
      character: 0,
    };
    this.contexts = [];
  }

  public find(syntaxNode: TreeNode, pos: Position, ...contexts: Contexts[]): Maybe<IFindResult> {
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

    // search instruction if instruction
    if (searchResult instanceof Inst.Inst) {
      const findResult = this.instAction(searchResult);

      // add context if not set yet
      if (!empty(findResult) && this.addContext(findResult, node)) {
        findResult.node = node;
      }

      return findResult;
    }

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
        node: this.isContext(node)
          ? node
          : undefined,
        token: searchResult,
      };
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
