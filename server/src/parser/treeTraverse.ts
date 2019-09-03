import {
  IExprVisitor,
  IStmtVisitor,
  IStmt,
  IExpr,
  ISuffixTermVisitor,
  ISuffixTerm,
} from './types';
import * as Decl from './declare';
import * as Stmt from './stmt';
import * as Expr from './expr';
import * as SuffixTerm from './suffixTerm';
import { empty } from '../utilities/typeGuards';

export abstract class TreeTraverse
  implements
    IExprVisitor<() => void>,
    IStmtVisitor<() => void>,
    ISuffixTermVisitor<() => void> {
  constructor() {}

  // find an statement
  protected stmtAction(stmt: IStmt): void {
    stmt.accept(this, []);
  }

  // find an expression
  protected exprAction(expr: IExpr): void {
    expr.accept(this, []);
  }

  // find an expression
  protected suffixTermAction(suffixTerm: ISuffixTerm): void {
    suffixTerm.accept(this, []);
  }

  public visitDeclVariable(decl: Decl.Var): void {
    this.exprAction(decl.value);
  }
  public visitDeclLock(decl: Decl.Lock): void {
    this.exprAction(decl.value);
  }
  public visitDeclFunction(decl: Decl.Func): void {
    this.stmtAction(decl.block);
  }
  public visitDeclParameter(decl: Decl.Param): void {
    for (const parameter of decl.optionalParameters) {
      this.exprAction(parameter.value);
    }
  }
  public visitStmtInvalid(_: Stmt.Invalid): void {}
  public visitBlock(stmt: Stmt.Block): void {
    for (const childStmt of stmt.stmts) {
      this.stmtAction(childStmt);
    }
  }
  public visitExpr(stmt: Stmt.ExprStmt): void {
    this.exprAction(stmt.suffix);
  }
  public visitOnOff(stmt: Stmt.OnOff): void {
    this.exprAction(stmt.suffix);
  }
  public visitCommand(_: Stmt.Command): void {}
  public visitCommandExpr(stmt: Stmt.CommandExpr): void {
    this.exprAction(stmt.expr);
  }
  public visitUnset(_: Stmt.Unset): void {}
  public visitUnlock(_: Stmt.Unlock): void {}
  public visitSet(stmt: Stmt.Set): void {
    this.exprAction(stmt.suffix);
    this.exprAction(stmt.value);
  }
  public visitLazyGlobal(_: Stmt.LazyGlobal): void {}
  public visitIf(stmt: Stmt.If): void {
    this.exprAction(stmt.condition);
    this.stmtAction(stmt.body);

    if (!empty(stmt.elseStmt)) {
      this.stmtAction(stmt.elseStmt);
    }
  }
  public visitElse(stmt: Stmt.Else): void {
    this.stmtAction(stmt.body);
  }
  public visitUntil(stmt: Stmt.Until): void {
    this.exprAction(stmt.condition);
    this.stmtAction(stmt.body);
  }
  public visitFrom(stmt: Stmt.From): void {
    this.stmtAction(stmt.initializer);
    this.exprAction(stmt.condition);
    this.stmtAction(stmt.increment);
    this.stmtAction(stmt.body);
  }
  public visitWhen(stmt: Stmt.When): void {
    this.exprAction(stmt.condition);
    this.stmtAction(stmt.body);
  }
  public visitReturn(stmt: Stmt.Return): void {
    if (!empty(stmt.value)) {
      this.exprAction(stmt.value);
    }
  }
  public visitBreak(_: Stmt.Break): void {}
  public visitSwitch(stmt: Stmt.Switch): void {
    this.exprAction(stmt.target);
  }
  public visitFor(stmt: Stmt.For): void {
    this.exprAction(stmt.collection);
    this.stmtAction(stmt.body);
  }
  public visitOn(stmt: Stmt.On): void {
    this.exprAction(stmt.suffix);
    this.stmtAction(stmt.body);
  }
  public visitToggle(stmt: Stmt.Toggle): void {
    this.exprAction(stmt.suffix);
  }
  public visitWait(stmt: Stmt.Wait): void {
    this.exprAction(stmt.expr);
  }
  public visitLog(stmt: Stmt.Log): void {
    this.exprAction(stmt.expr);
    this.exprAction(stmt.target);
  }
  public visitCopy(stmt: Stmt.Copy): void {
    this.exprAction(stmt.target);
    this.exprAction(stmt.destination);
  }
  public visitRename(stmt: Stmt.Rename): void {
    this.exprAction(stmt.target);
    this.exprAction(stmt.alternative);
  }
  public visitDelete(stmt: Stmt.Delete): void {
    this.exprAction(stmt.target);

    if (!empty(stmt.volume)) {
      this.exprAction(stmt.volume);
    }
  }
  public visitRun(stmt: Stmt.Run): void {
    if (!empty(stmt.args)) {
      for (const arg of stmt.args) {
        this.exprAction(arg);
      }
    }

    if (!empty(stmt.expr)) {
      this.exprAction(stmt.expr);
    }
  }
  public visitRunPath(stmt: Stmt.RunPath): void {
    this.exprAction(stmt.expr);
    if (!empty(stmt.args)) {
      for (const arg of stmt.args) {
        this.exprAction(arg);
      }
    }
  }
  public visitRunPathOnce(stmt: Stmt.RunOncePath): void {
    this.exprAction(stmt.expr);
    if (!empty(stmt.args)) {
      for (const arg of stmt.args) {
        this.exprAction(arg);
      }
    }
  }
  public visitCompile(stmt: Stmt.Compile): void {
    this.exprAction(stmt.target);
    if (!empty(stmt.destination)) {
      this.exprAction(stmt.destination);
    }
  }
  public visitList(_: Stmt.List): void {}
  public visitEmpty(_: Stmt.Empty): void {}
  public visitPrint(stmt: Stmt.Print): void {
    this.exprAction(stmt.expr);

    if (!empty(stmt.x)) {
      this.exprAction(stmt.x);
    }
    if (!empty(stmt.y)) {
      this.exprAction(stmt.y);
    }
  }
  public visitExprInvalid(_: Expr.Invalid): void {}
  public visitTernary(expr: Expr.Ternary): void {
    this.exprAction(expr.condition);
    this.exprAction(expr.trueExpr);
    this.exprAction(expr.falseExpr);
  }

  public visitBinary(expr: Expr.Binary): void {
    this.exprAction(expr.left);
    this.exprAction(expr.right);
  }
  public visitUnary(expr: Expr.Unary): void {
    this.exprAction(expr.factor);
  }
  public visitFactor(expr: Expr.Factor): void {
    this.exprAction(expr.suffix);
    this.exprAction(expr.exponent);
  }
  public visitSuffix(expr: Expr.Suffix): void {
    this.suffixTermAction(expr.suffixTerm);

    if (!empty(expr.trailer)) {
      this.suffixTermAction(expr.trailer);
    }
  }
  public visitLambda(expr: Expr.Lambda): void {
    this.stmtAction(expr.block);
  }
  public visitSuffixTermInvalid(_: SuffixTerm.Invalid): void {}
  public visitSuffixTrailer(suffixTerm: SuffixTerm.SuffixTrailer): void {
    this.suffixTermAction(suffixTerm.suffixTerm);

    if (!empty(suffixTerm.trailer)) {
      this.suffixTermAction(suffixTerm.trailer);
    }
  }
  public visitSuffixTerm(suffixTerm: SuffixTerm.SuffixTerm): void {
    this.suffixTermAction(suffixTerm.atom);
    for (const trailer of suffixTerm.trailers) {
      this.suffixTermAction(trailer);
    }
  }
  public visitCall(suffixTerm: SuffixTerm.Call): void {
    for (const arg of suffixTerm.args) {
      this.exprAction(arg);
    }
  }
  public visitArrayIndex(_: SuffixTerm.ArrayIndex): void {}
  public visitArrayBracket(suffixTerm: SuffixTerm.ArrayBracket): void {
    this.exprAction(suffixTerm.index);
  }
  public visitDelegate(_: SuffixTerm.Delegate): void {}
  public visitLiteral(_: SuffixTerm.Literal): void {}
  public visitIdentifier(_: SuffixTerm.Identifier): void {}
  public visitGrouping(suffixTerm: SuffixTerm.Grouping): void {
    this.exprAction(suffixTerm.expr);
  }
}
