import { IExprVisitor, IInstVisitor } from './types';
import { IToken } from '../entities/types';
import { DeclVariable, DeclLock, DeclFunction, DeclParameter } from './declare';
import {
  BlockInst, ExprInst, OnOffInst,
  CommandInst, CommandExpressionInst,
  UnsetInst, UnlockInst, SetInst,
  LazyGlobalInst, IfInst, ElseInst,
  UntilInst, FromInst, WhenInst, ReturnInst,
  BreakInst, SwitchInst, ForInst, OnInst,
  ToggleInst, WaitInst, LogInst, CopyInst,
  RenameInst, DeleteInst, RunInst,
  RunPathInst, RunPathOnceInst, CompileInst,
  ListInst, EmptyInst, PrintInst,
} from './inst';
import {
  BinaryExpr, UnaryExpr, FactorExpr, SuffixExpr,
  CallExpr, ArrayIndexExpr, ArrayBracketExpr,
  DelegateExpr, LiteralExpr, VariableExpr,
  GroupingExpr, AnonymousFunctionExpr,
} from './expr';
import { SyntaxTree } from '../entities/syntaxTree';
import { Position } from 'vscode-languageserver';

export class SyntaxTreeFind implements IExprVisitor<Maybe<IToken>>, IInstVisitor<Maybe<IToken>> {

  constructor() { }

  find(snytaxTree: SyntaxTree, pos: Position) {
    
  }

  visitDeclVariable(decl: DeclVariable): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitDeclLock(decl: DeclLock): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitDeclFunction(decl: DeclFunction): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitDeclParameter(decl: DeclParameter): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitBlock(inst: BlockInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitExpr(inst: ExprInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitOnOff(inst: OnOffInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitCommand(inst: CommandInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitCommandExpr(inst: CommandExpressionInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitUnset(inst: UnsetInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitUnlock(inst: UnlockInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitSet(inst: SetInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitLazyGlobalInst(inst: LazyGlobalInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitIf(inst: IfInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitElse(inst: ElseInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitUntil(inst: UntilInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitFrom(inst: FromInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitWhen(inst: WhenInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitReturn(inst: ReturnInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitBreak(inst: BreakInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitSwitch(inst: SwitchInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitFor(inst: ForInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitOn(inst: OnInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitToggle(inst: ToggleInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitWait(inst: WaitInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitLog(inst: LogInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitCopy(inst: CopyInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitRename(inst: RenameInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitDelete(inst: DeleteInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitRun(inst: RunInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitRunPath(inst: RunPathInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitRunPathOnce(inst: RunPathOnceInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitCompile(inst: CompileInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitList(inst: ListInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitEmpty(inst: EmptyInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitPrint(inst: PrintInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitBinary(expr: BinaryExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitUnary(expr: UnaryExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitFactor(expr: FactorExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitSuffix(expr: SuffixExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitCall(expr: CallExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitArrayIndex(expr: ArrayIndexExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitArrayBracket(expr: ArrayBracketExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitDelegate(expr: DelegateExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitLiteral(expr: LiteralExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitVariable(expr: VariableExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitGrouping(expr: GroupingExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitAnonymousFunction(expr: AnonymousFunctionExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
}
