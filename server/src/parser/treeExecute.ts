import {
  IExprVisitor, IStmtVisitor, IStmt,
  IExpr, ScriptNode,
  ISuffixTermVisitor,
  ISuffixTerm,
} from './types';
import * as Decl from './declare';
import * as Stmt from './stmt';
import * as Expr from './expr';
import * as SuffixTerm from './suffixTerm';

export abstract class TreeExecute<T> implements
  IExprVisitor<T>,
  IStmtVisitor<T>,
  ISuffixTermVisitor<T> {

  constructor() { }

  protected abstract nodeAction(node: ScriptNode): T;

  // find an statement
  protected stmtAction(stmt: IStmt): T {
    return stmt.accept(this);
  }

  // find an expression
  protected exprAction(expr: IExpr): T {
    return expr.accept(this);
  }

  // find an expression
  protected suffixTermAction(suffixTerm: ISuffixTerm): T {
    return suffixTerm.accept(this);
  }

  public visitDeclVariable(decl: Decl.Var): T {
    return this.nodeAction(decl);
  }
  public visitDeclLock(decl: Decl.Lock): T {
    return this.nodeAction(decl);
  }
  public visitDeclFunction(decl: Decl.Func): T {
    return this.nodeAction(decl);
  }
  public visitDeclParameter(decl: Decl.Param): T {
    return this.nodeAction(decl);
  }
  public visitStmtInvalid(stmt: Stmt.Invalid): T {
    return this.nodeAction(stmt);
  }
  public visitBlock(stmt: Stmt.Block): T {
    return this.nodeAction(stmt);
  }
  public visitExpr(stmt: Stmt.ExprStmt): T {
    return this.nodeAction(stmt);
  }
  public visitOnOff(stmt: Stmt.OnOff): T {
    return this.nodeAction(stmt);
  }
  public visitCommand(stmt: Stmt.Command): T {
    return this.nodeAction(stmt);
  }
  public visitCommandExpr(stmt: Stmt.CommandExpr): T {
    return this.nodeAction(stmt);
  }
  public visitUnset(stmt: Stmt.Unset): T {
    return this.nodeAction(stmt);
  }
  public visitUnlock(stmt: Stmt.Unlock): T {
    return this.nodeAction(stmt);
  }
  public visitSet(stmt: Stmt.Set): T {
    return this.nodeAction(stmt);
  }
  public visitLazyGlobal(stmt: Stmt.LazyGlobal): T {
    return this.nodeAction(stmt);
  }
  public visitIf(stmt: Stmt.If): T {
    return this.nodeAction(stmt);
  }
  public visitElse(stmt: Stmt.Else): T {
    return this.nodeAction(stmt);
  }
  public visitUntil(stmt: Stmt.Until): T {
    return this.nodeAction(stmt);
  }
  public visitFrom(stmt: Stmt.From): T {
    return this.nodeAction(stmt);
  }
  public visitWhen(stmt: Stmt.When): T {
    return this.nodeAction(stmt);
  }
  public visitReturn(stmt: Stmt.Return): T {
    return this.nodeAction(stmt);
  }
  public visitBreak(stmt: Stmt.Break): T {
    return this.nodeAction(stmt);
  }
  public visitSwitch(stmt: Stmt.Switch): T {
    return this.nodeAction(stmt);
  }
  public visitFor(stmt: Stmt.For): T {
    return this.nodeAction(stmt);
  }
  public visitOn(stmt: Stmt.On): T {
    return this.nodeAction(stmt);
  }
  public visitToggle(stmt: Stmt.Toggle): T {
    return this.nodeAction(stmt);
  }
  public visitWait(stmt: Stmt.Wait): T {
    return this.nodeAction(stmt);
  }
  public visitLog(stmt: Stmt.Log): T {
    return this.nodeAction(stmt);
  }
  public visitCopy(stmt: Stmt.Copy): T {
    return this.nodeAction(stmt);
  }
  public visitRename(stmt: Stmt.Rename): T {
    return this.nodeAction(stmt);
  }
  public visitDelete(stmt: Stmt.Delete): T {
    return this.nodeAction(stmt);
  }
  public visitRun(stmt: Stmt.Run): T {
    return this.nodeAction(stmt);
  }
  public visitRunPath(stmt: Stmt.RunPath): T {
    return this.nodeAction(stmt);
  }
  public visitRunPathOnce(stmt: Stmt.RunOncePath): T {
    return this.nodeAction(stmt);
  }
  public visitCompile(stmt: Stmt.Compile): T {
    return this.nodeAction(stmt);
  }
  public visitList(stmt: Stmt.List): T {
    return this.nodeAction(stmt);
  }
  public visitEmpty(stmt: Stmt.Empty): T {
    return this.nodeAction(stmt);
  }
  public visitPrint(stmt: Stmt.Print): T {
    return this.nodeAction(stmt);
  }
  public visitExprInvalid(expr: Expr.Invalid): T {
    return this.nodeAction(expr);
  }
  public visitTernary(expr: Expr.Ternary): T {
    return this.nodeAction(expr);
  }
  public visitBinary(expr: Expr.Binary): T {
    return this.nodeAction(expr);
  }
  public visitUnary(expr: Expr.Unary): T {
    return this.nodeAction(expr);
  }
  public visitFactor(expr: Expr.Factor): T {
    return this.nodeAction(expr);
  }
  public visitSuffix(expr: Expr.Suffix): T {
    return this.nodeAction(expr);
  }
  public visitSuffixTermInvalid(suffixTerm: SuffixTerm.Invalid): T {
    return this.nodeAction(suffixTerm);
  }
  public visitSuffixTrailer(suffixTerm: SuffixTerm.SuffixTrailer): T {
    return this.nodeAction(suffixTerm);
  }
  public visitSuffixTerm(suffixTerm: SuffixTerm.SuffixTerm): T {
    return this.nodeAction(suffixTerm);
  }
  public visitCall(suffixTerm: SuffixTerm.Call): T {
    return this.nodeAction(suffixTerm);
  }
  public visitArrayIndex(suffixTerm: SuffixTerm.ArrayIndex): T {
    return this.nodeAction(suffixTerm);
  }
  public visitArrayBracket(suffixTerm: SuffixTerm.ArrayBracket): T {
    return this.nodeAction(suffixTerm);
  }
  public visitDelegate(suffixTerm: SuffixTerm.Delegate): T {
    return this.nodeAction(suffixTerm);
  }
  public visitLiteral(suffixTerm: SuffixTerm.Literal): T {
    return this.nodeAction(suffixTerm);
  }
  public visitIdentifier(suffixTerm: SuffixTerm.Identifier): T {
    return this.nodeAction(suffixTerm);
  }
  public visitGrouping(suffixTerm: SuffixTerm.Grouping): T {
    return this.nodeAction(suffixTerm);
  }
  public visitLambda(expr: Expr.Lambda): T {
    return this.nodeAction(expr);
  }
}
