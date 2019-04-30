
import { IFunctionScanResult } from './types';
import { TraverseTree } from '../parser/traverseTree';
import { TreeNode } from '../parser/types';
import * as Decl from '../parser/declare';
import * as Expr from '../parser/expr';
import * as Inst from '../parser/inst';

/**
 * Class to help identify parameters and return instructions in
 * a kerboscript function
 */
export class FunctionScan extends TraverseTree<Maybe<void>> {
  /**
   * result of the scan
   */
  private result: IFunctionScanResult;

  /**
   * Function scan constructor
   */
  constructor() {
    super();
    this.result = {
      parameters: 0,
      return: false,
    };
  }

  /**
   * Scan the function node for parameters and return instructions
   * @param syntaxNode function body
   */
  public scan(syntaxNode: TreeNode): Maybe<IFunctionScanResult> {
    this.result = {
      parameters: 0,
      return: false,
    };
    this.nodeAction(syntaxNode);

    return { ...this.result };
  }

  /**
   * Action to apply at each node traversed
   * @param node node in question
   */
  protected nodeAction(node: TreeNode): Maybe<void> {
    // traverse anonymous functions
    if (node instanceof Expr.AnonymousFunction) {
      this.exprAction(node);
    }

    // traverse instructions
    if (node instanceof Inst.Inst) {

      // stop if we find another function
      if (node instanceof Decl.Func) {
        return;
      }

      // indicate return instruction exists
      if (node instanceof Inst.Return) {
        this.result.return = true;
      }

      this.instAction(node);
    }

    // Note this has no logic to detect parameters in loops
    // increment parameter count
    if (node instanceof Decl.Parameter) {
      this.result.parameters += 1;
    }
  }
}
