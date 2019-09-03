import { IFunctionScanResult } from './types';
import * as Decl from '../parser/declare';
import * as Expr from '../parser/expr';
import * as Stmt from '../parser/stmt';
import { TreeTraverse } from '../parser/treeTraverse';

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
  public scan(node: Stmt.Block): IFunctionScanResult {
    this.result = {
      requiredParameters: 0,
      optionalParameters: 0,
      return: false,
    };

    this.stmtAction(node);

    return { ...this.result };
  }

  /**
   * Indicate that the function has a return statement
   * @param _ return statement
   */
  public visitReturn(_: Stmt.Return): void {
    this.result.return = true;
  }

  /**
   * Don't proceed further in if enter another function
   * @param _ function declaration
   */
  public visitDeclFunction(_: Decl.Func): void {}

  /**
   * Add required and optional parameters when found
   * @param decl parameter declaration
   */
  public visitDeclParameter(decl: Decl.Param): void {
    this.result.requiredParameters += decl.requiredParameters.length;
    this.result.optionalParameters += decl.optionalParameters.length;
  }

  /**
   * Don't proceed further if another lambda is encountered
   * @param expr lambda expression
   */
  public visitLambda(_: Expr.Lambda): void {}
}
