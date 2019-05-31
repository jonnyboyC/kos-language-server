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
import { empty } from '../utilities/typeGuards';

export abstract class TreeTraverse implements
  IExprVisitor<void>,
  IStmtVisitor<void>,
  ISuffixTermVisitor<void> {

  constructor() { }

  protected abstract nodeAction(node: ScriptNode): boolean;

  // find an statement
  protected stmtAction(stmt: IStmt): void {
    return stmt.accept(this);
  }

  // find an expression
  protected exprAction(expr: IExpr): void {
    return expr.accept(this);
  }

  // find an expression
  protected suffixTermAction(suffixTerm: ISuffixTerm): void {
    return suffixTerm.accept(this);
  }

  public visitDeclVariable(decl: Decl.Var): void {
    if (this.nodeAction(decl)) {
      this.exprAction(decl.value);
    }
  }
  public visitDeclLock(decl: Decl.Lock): void {
    if (this.nodeAction(decl)) {
      this.exprAction(decl.value);
    }
  }
  public visitDeclFunction(decl: Decl.Func): void {
    if (this.nodeAction(decl)) {
      this.stmtAction(decl.block);
    }
  }
  public visitDeclParameter(decl: Decl.Param): void {
    this.nodeAction(decl);
  }
  public visitStmtInvalid(stmt: Stmt.Invalid): void {
    this.nodeAction(stmt);
  }
  public visitBlock(stmt: Stmt.Block): void {
    if (this.nodeAction(stmt)) {
      for (const childStmt of stmt.stmts) {
        this.stmtAction(childStmt);
      }
    }
  }
  public visitExpr(stmt: Stmt.ExprStmt): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.suffix);
    }
  }
  public visitOnOff(stmt: Stmt.OnOff): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.suffix);
    }
  }
  public visitCommand(stmt: Stmt.Command): void {
    this.nodeAction(stmt);
  }
  public visitCommandExpr(stmt: Stmt.CommandExpr): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.expr);
    }
  }
  public visitUnset(stmt: Stmt.Unset): void {
    this.nodeAction(stmt);
  }
  public visitUnlock(stmt: Stmt.Unlock): void {
    this.nodeAction(stmt);
  }
  public visitSet(stmt: Stmt.Set): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.suffix);
      this.exprAction(stmt.value);
    }
  }
  public visitLazyGlobal(stmt: Stmt.LazyGlobal): void {
    this.nodeAction(stmt);
  }
  public visitIf(stmt: Stmt.If): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.condition);
      this.stmtAction(stmt.body);

      if (!empty(stmt.elseStmt)) {
        this.stmtAction(stmt.elseStmt);
      }
    }
  }
  public visitElse(stmt: Stmt.Else): void {
    if (this.nodeAction(stmt)) {
      this.stmtAction(stmt.body);
    }
  }
  public visitUntil(stmt: Stmt.Until): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.condition);
      this.stmtAction(stmt.body);
    }
  }
  public visitFrom(stmt: Stmt.From): void {
    if (this.nodeAction(stmt)) {
      this.stmtAction(stmt.initializer);
      this.exprAction(stmt.condition);
      this.stmtAction(stmt.increment);
      this.stmtAction(stmt.body);
    }
  }
  public visitWhen(stmt: Stmt.When): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.condition);
      this.stmtAction(stmt.body);
    }
  }
  public visitReturn(stmt: Stmt.Return): void {
    if (this.nodeAction(stmt)) {
      if (!empty(stmt.value)) {
        this.exprAction(stmt.value);
      }
    }
  }
  public visitBreak(stmt: Stmt.Break): void {
    this.nodeAction(stmt);
  }
  public visitSwitch(stmt: Stmt.Switch): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.target);
    }
  }
  public visitFor(stmt: Stmt.For): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.collection);
      this.stmtAction(stmt.body);
    }
  }
  public visitOn(stmt: Stmt.On): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.suffix);
      this.stmtAction(stmt.body);
    }
  }
  public visitToggle(stmt: Stmt.Toggle): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.suffix);
    }
  }
  public visitWait(stmt: Stmt.Wait): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.expr);
    }
  }
  public visitLog(stmt: Stmt.Log): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.expr);
      this.exprAction(stmt.target);
    }
  }
  public visitCopy(stmt: Stmt.Copy): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.target);
      this.exprAction(stmt.destination);
    }
  }
  public visitRename(stmt: Stmt.Rename): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.target);
      this.exprAction(stmt.alternative);
    }
  }
  public visitDelete(stmt: Stmt.Delete): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.target);

      if (!empty(stmt.volume)) {
        this.exprAction(stmt.volume);
      }
    }
  }
  public visitRun(stmt: Stmt.Run): void {
    if (this.nodeAction(stmt)) {
      if (!empty(stmt.args)) {
        for (const arg of stmt.args) {
          this.exprAction(arg);
        }
      }

      if (!empty(stmt.expr)) {
        this.exprAction(stmt.expr);
      }
    }
  }
  public visitRunPath(stmt: Stmt.RunPath): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.expr);
      if (!empty(stmt.args)) {
        for (const arg of stmt.args) {
          this.exprAction(arg);
        }
      }
    }
  }
  public visitRunPathOnce(stmt: Stmt.RunOncePath): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.expr);
      if (!empty(stmt.args)) {
        for (const arg of stmt.args) {
          this.exprAction(arg);
        }
      }
    }
  }
  public visitCompile(stmt: Stmt.Compile): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.target);
      if (!empty(stmt.destination)) {
        this.exprAction(stmt.destination);
      }
    }
  }
  public visitList(stmt: Stmt.List): void {
    this.nodeAction(stmt);
  }
  public visitEmpty(stmt: Stmt.Empty): void {
    this.nodeAction(stmt);
  }
  public visitPrint(stmt: Stmt.Print): void {
    if (this.nodeAction(stmt)) {
      this.exprAction(stmt.expr);

      if (!empty(stmt.x)) {
        this.exprAction(stmt.x);
      }
      if (!empty(stmt.y)) {
        this.exprAction(stmt.y);
      }
    }
  }
  public visitExprInvalid(expr: Expr.Invalid): void {
    this.nodeAction(expr);
  }
  public visitBinary(expr: Expr.Binary): void {
    if (this.nodeAction(expr)) {
      this.exprAction(expr.left);
      this.exprAction(expr.right);
    }
  }
  public visitUnary(expr: Expr.Unary): void {
    if (this.nodeAction(expr)) {
      this.exprAction(expr.factor);
    }
  }
  public visitFactor(expr: Expr.Factor): void {
    if (this.nodeAction(expr)) {
      this.exprAction(expr.suffix);
      this.exprAction(expr.exponent);
    }
  }
  public visitSuffix(expr: Expr.Suffix): void {
    if (this.nodeAction(expr)) {
      this.suffixTermAction(expr.suffixTerm);

      if (!empty(expr.trailer)) {
        this.suffixTermAction(expr.trailer);
      }
    }
  }
  public visitLambda(expr: Expr.Lambda): void {
    if (this.nodeAction(expr)) {
      this.stmtAction(expr.block);
    }
  }
  public visitSuffixTermInvalid(suffixTerm: SuffixTerm.Invalid): void {
    this.nodeAction(suffixTerm);
  }
  public visitSuffixTrailer(suffixTerm: SuffixTerm.SuffixTrailer): void {
    if (this.nodeAction(suffixTerm)) {
      this.suffixTermAction(suffixTerm.suffixTerm);

      if (!empty(suffixTerm.trailer)) {
        this.suffixTermAction(suffixTerm.trailer);
      }
    }
  }
  public visitSuffixTerm(suffixTerm: SuffixTerm.SuffixTerm): void {
    if (this.nodeAction(suffixTerm)) {
      this.suffixTermAction(suffixTerm.atom);
      for (const trailer of suffixTerm.trailers) {
        this.suffixTermAction(trailer);
      }
    }
  }
  public visitCall(suffixTerm: SuffixTerm.Call): void {
    if (this.nodeAction(suffixTerm)) {
      for (const arg of suffixTerm.args) {
        this.exprAction(arg);
      }
    }
  }
  public visitArrayIndex(suffixTerm: SuffixTerm.ArrayIndex): void {
    this.nodeAction(suffixTerm);
  }
  public visitArrayBracket(suffixTerm: SuffixTerm.ArrayBracket): void {
    if (this.nodeAction(suffixTerm)) {
      this.exprAction(suffixTerm.index);
    }
  }
  public visitDelegate(suffixTerm: SuffixTerm.Delegate): void {
    this.nodeAction(suffixTerm);
  }
  public visitLiteral(suffixTerm: SuffixTerm.Literal): void {
    this.nodeAction(suffixTerm);
  }
  public visitIdentifier(suffixTerm: SuffixTerm.Identifier): void {
    this.nodeAction(suffixTerm);
  }
  public visitGrouping(suffixTerm: SuffixTerm.Grouping): void {
    if (this.nodeAction(suffixTerm)) {
      this.exprAction(suffixTerm.expr);
    }
  }
}
