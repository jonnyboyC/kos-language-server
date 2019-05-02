import { IFunctionScanResult } from './types';
import { TreeNode } from '../parser/types';
import * as Decl from '../parser/declare';
import * as Expr from '../parser/expr';
import * as Inst from '../parser/inst';
import { TreeTraverse } from '../parser/treeTraverse';
import * as SuffixTerm from '../parser/suffixTerm';

/**
 * Class to help identify parameters and return instructions in
 * a kerboscript function
 */
export class FunctionScan extends TreeTraverse {
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
   * @param node function body
   */
  public scan(node: TreeNode): Maybe<IFunctionScanResult> {
    this.result = {
      parameters: 0,
      return: false,
    };

    if (node instanceof Expr.Expr) {
      this.exprAction(node);
    } else if (node instanceof Inst.Inst) {
      this.instAction(node);
    } else if (node instanceof SuffixTerm.SuffixTerm) {
      this.suffixTermAction(node);
    }

    return { ...this.result };
  }

  /**
   * Action to apply at each node traversed
   * @param node node in question
   */
  protected nodeAction(node: TreeNode): boolean {
    // traverse anonymous functions
    if (node instanceof Expr.Lambda) {
      return true;
    }

    // traverse instructions
    if (node instanceof Inst.Inst) {
      // stop if we find another function
      if (node instanceof Decl.Func) {
        return false;
      }

      // indicate return instruction exists
      if (node instanceof Inst.Return) {
        this.result.return = true;
      }

      // Note this has no logic to detect parameters in loops
      // increment parameter count
      if (node instanceof Decl.Param) {
        this.result.parameters +=
          node.defaultParameters.length + node.parameters.length;
      }

      return true;
    }

    return false;
  }
}
