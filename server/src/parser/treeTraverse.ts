import {
  IExprVisitor, IInstVisitor, IInst,
  IExpr, ScriptNode,
  ISuffixTermVisitor,
  ISuffixTerm,
} from './types';
import * as Decl from './declare';
import * as Inst from './inst';
import * as Expr from './expr';
import * as SuffixTerm from './suffixTerm';
import { empty } from '../utilities/typeGuards';

export abstract class TreeTraverse implements
  IExprVisitor<void>,
  IInstVisitor<void>,
  ISuffixTermVisitor<void> {

  constructor() { }

  protected abstract nodeAction(node: ScriptNode): boolean;

  // find an instruction
  protected instAction(inst: IInst): void {
    return inst.accept(this);
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
      this.instAction(decl.block);
    }
  }
  public visitDeclParameter(decl: Decl.Param): void {
    this.nodeAction(decl);
  }
  public visitInstInvalid(inst: Inst.Invalid): void {
    this.nodeAction(inst);
  }
  public visitBlock(inst: Inst.Block): void {
    if (this.nodeAction(inst)) {
      for (const childInst of inst.insts) {
        this.instAction(childInst);
      }
    }
  }
  public visitExpr(inst: Inst.ExprInst): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.suffix);
    }
  }
  public visitOnOff(inst: Inst.OnOff): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.suffix);
    }
  }
  public visitCommand(inst: Inst.Command): void {
    this.nodeAction(inst);
  }
  public visitCommandExpr(inst: Inst.CommandExpr): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.expr);
    }
  }
  public visitUnset(inst: Inst.Unset): void {
    this.nodeAction(inst);
  }
  public visitUnlock(inst: Inst.Unlock): void {
    this.nodeAction(inst);
  }
  public visitSet(inst: Inst.Set): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.suffix);
      this.exprAction(inst.value);
    }
  }
  public visitLazyGlobal(inst: Inst.LazyGlobal): void {
    this.nodeAction(inst);
  }
  public visitIf(inst: Inst.If): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.condition);
      this.instAction(inst.ifInst);

      if (!empty(inst.elseInst)) {
        this.instAction(inst.elseInst);
      }
    }
  }
  public visitElse(inst: Inst.Else): void {
    if (this.nodeAction(inst)) {
      this.instAction(inst.inst);
    }
  }
  public visitUntil(inst: Inst.Until): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.condition);
      this.instAction(inst.inst);
    }
  }
  public visitFrom(inst: Inst.From): void {
    if (this.nodeAction(inst)) {
      this.instAction(inst.initializer);
      this.exprAction(inst.condition);
      this.instAction(inst.increment);
      this.instAction(inst.inst);
    }
  }
  public visitWhen(inst: Inst.When): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.condition);
      this.instAction(inst.inst);
    }
  }
  public visitReturn(inst: Inst.Return): void {
    if (this.nodeAction(inst)) {
      if (!empty(inst.expr)) {
        this.exprAction(inst.expr);
      }
    }
  }
  public visitBreak(inst: Inst.Break): void {
    this.nodeAction(inst);
  }
  public visitSwitch(inst: Inst.Switch): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.target);
    }
  }
  public visitFor(inst: Inst.For): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.suffix);
      this.instAction(inst.inst);
    }
  }
  public visitOn(inst: Inst.On): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.suffix);
      this.instAction(inst.inst);
    }
  }
  public visitToggle(inst: Inst.Toggle): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.suffix);
    }
  }
  public visitWait(inst: Inst.Wait): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.expr);
    }
  }
  public visitLog(inst: Inst.Log): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.expr);
      this.exprAction(inst.target);
    }
  }
  public visitCopy(inst: Inst.Copy): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.target);
      this.exprAction(inst.destination);
    }
  }
  public visitRename(inst: Inst.Rename): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.target);
      this.exprAction(inst.alternative);
    }
  }
  public visitDelete(inst: Inst.Delete): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.target);

      if (!empty(inst.volume)) {
        this.exprAction(inst.volume);
      }
    }
  }
  public visitRun(inst: Inst.Run): void {
    if (this.nodeAction(inst)) {
      if (!empty(inst.args)) {
        for (const arg of inst.args) {
          this.exprAction(arg);
        }
      }

      if (!empty(inst.expr)) {
        this.exprAction(inst.expr);
      }
    }
  }
  public visitRunPath(inst: Inst.RunPath): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.expr);
      if (!empty(inst.args)) {
        for (const arg of inst.args) {
          this.exprAction(arg);
        }
      }
    }
  }
  public visitRunPathOnce(inst: Inst.RunPathOnce): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.expr);
      if (!empty(inst.args)) {
        for (const arg of inst.args) {
          this.exprAction(arg);
        }
      }
    }
  }
  public visitCompile(inst: Inst.Compile): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.target);
      if (!empty(inst.destination)) {
        this.exprAction(inst.destination);
      }
    }
  }
  public visitList(inst: Inst.List): void {
    this.nodeAction(inst);
  }
  public visitEmpty(inst: Inst.Empty): void {
    this.nodeAction(inst);
  }
  public visitPrint(inst: Inst.Print): void {
    if (this.nodeAction(inst)) {
      this.exprAction(inst.expr);

      if (!empty(inst.x)) {
        this.exprAction(inst.x);
      }
      if (!empty(inst.y)) {
        this.exprAction(inst.y);
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
      this.instAction(expr.block);
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
