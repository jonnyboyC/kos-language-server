import { IFunctionScanResult } from './types';
import { ScriptNode } from '../parser/types';
import * as Decl from '../parser/declare';
import * as Expr from '../parser/expr';
import * as Stmt from '../parser/stmt';
import { TreeTraverse } from '../parser/treeTraverse';
import * as SuffixTerm from '../parser/suffixTerm';

/**
 * Class to help identify parameters and return statements in
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
      requiredParameters: 0,
      optionalParameters: 0,
      return: false,
    };
  }

  /**
   * Scan the function node for parameters and return statements
   * @param node function body
   */
  public scan(node: ScriptNode): IFunctionScanResult {
    this.result = {
      requiredParameters: 0,
      optionalParameters: 0,
      return: false,
    };

    if (node instanceof Expr.Expr) {
      this.exprAction(node);
    } else if (node instanceof Stmt.Stmt) {
      this.stmtAction(node);
    } else if (node instanceof SuffixTerm.SuffixTerm) {
      this.suffixTermAction(node);
    }

    return { ...this.result };
  }

  /**
   * Action to apply at each node traversed
   * @param node node in question
   */
  protected nodeAction(node: ScriptNode): boolean {
    // traverse anonymous functions
    if (node instanceof Expr.Lambda) {
      return true;
    }

    // traverse statements
    if (node instanceof Stmt.Stmt) {
      // stop if we find another function
      if (node instanceof Decl.Func) {
        return false;
      }

      // indicate return statement exists
      if (node instanceof Stmt.Return) {
        this.result.return = true;
      }

      // Note this has no logic to detect parameters in loops
      // increment parameter count
      if (node instanceof Decl.Param) {
        this.result.requiredParameters += node.requiredParameters.length;
        this.result.optionalParameters += node.optionalParameters.length;
      }

      return true;
    }

    return false;
  }
}
