import {
  IExprVisitor, IInstVisitor, IInst,
  IExpr, TreeNode,
  ISuffixTermVisitor,
  ISuffixTerm,
} from './types';
import * as Decl from './declare';
import * as Inst from './inst';
import * as Expr from './expr';
import * as SuffixTerm from './suffixTerm';

export abstract class TraverseTree<T> implements
  IExprVisitor<T>,
  IInstVisitor<T>,
  ISuffixTermVisitor<T> {

  constructor() { }

  protected abstract nodeAction(node: TreeNode): T;

  // find an instruction
  protected instAction(inst: IInst): T {
    return inst.accept(this);
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
  public visitInstInvalid(inst: Inst.Invalid): T {
    return this.nodeAction(inst);
  }
  public visitBlock(inst: Inst.Block): T {
    return this.nodeAction(inst);
  }
  public visitExpr(inst: Inst.ExprInst): T {
    return this.nodeAction(inst);
  }
  public visitOnOff(inst: Inst.OnOff): T {
    return this.nodeAction(inst);
  }
  public visitCommand(inst: Inst.Command): T {
    return this.nodeAction(inst);
  }
  public visitCommandExpr(inst: Inst.CommandExpr): T {
    return this.nodeAction(inst);
  }
  public visitUnset(inst: Inst.Unset): T {
    return this.nodeAction(inst);
  }
  public visitUnlock(inst: Inst.Unlock): T {
    return this.nodeAction(inst);
  }
  public visitSet(inst: Inst.Set): T {
    return this.nodeAction(inst);
  }
  public visitLazyGlobal(inst: Inst.LazyGlobal): T {
    return this.nodeAction(inst);
  }
  public visitIf(inst: Inst.If): T {
    return this.nodeAction(inst);
  }
  public visitElse(inst: Inst.Else): T {
    return this.nodeAction(inst);
  }
  public visitUntil(inst: Inst.Until): T {
    return this.nodeAction(inst);
  }
  public visitFrom(inst: Inst.From): T {
    return this.nodeAction(inst);
  }
  public visitWhen(inst: Inst.When): T {
    return this.nodeAction(inst);
  }
  public visitReturn(inst: Inst.Return): T {
    return this.nodeAction(inst);
  }
  public visitBreak(inst: Inst.Break): T {
    return this.nodeAction(inst);
  }
  public visitSwitch(inst: Inst.Switch): T {
    return this.nodeAction(inst);
  }
  public visitFor(inst: Inst.For): T {
    return this.nodeAction(inst);
  }
  public visitOn(inst: Inst.On): T {
    return this.nodeAction(inst);
  }
  public visitToggle(inst: Inst.Toggle): T {
    return this.nodeAction(inst);
  }
  public visitWait(inst: Inst.Wait): T {
    return this.nodeAction(inst);
  }
  public visitLog(inst: Inst.Log): T {
    return this.nodeAction(inst);
  }
  public visitCopy(inst: Inst.Copy): T {
    return this.nodeAction(inst);
  }
  public visitRename(inst: Inst.Rename): T {
    return this.nodeAction(inst);
  }
  public visitDelete(inst: Inst.Delete): T {
    return this.nodeAction(inst);
  }
  public visitRun(inst: Inst.Run): T {
    return this.nodeAction(inst);
  }
  public visitRunPath(inst: Inst.RunPath): T {
    return this.nodeAction(inst);
  }
  public visitRunPathOnce(inst: Inst.RunPathOnce): T {
    return this.nodeAction(inst);
  }
  public visitCompile(inst: Inst.Compile): T {
    return this.nodeAction(inst);
  }
  public visitList(inst: Inst.List): T {
    return this.nodeAction(inst);
  }
  public visitEmpty(inst: Inst.Empty): T {
    return this.nodeAction(inst);
  }
  public visitPrint(inst: Inst.Print): T {
    return this.nodeAction(inst);
  }
  public visitExprInvalid(expr: Expr.Invalid): T {
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
  public visitAnonymousFunction(expr: Expr.AnonymousFunction): T {
    return this.nodeAction(expr);
  }
}
