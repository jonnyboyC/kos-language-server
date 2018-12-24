import {
  BinaryExpr, UnaryExpr, FactorExpr,
  SuffixExpr, CallExpr, ArrayIndexExpr,
  ArrayBracketExpr, DelegateExpr, LiteralExpr,
  VariableExpr, GroupingExpr,
  AnonymousFunctionExpr,
} from './expr';
import {
  BlockInst, ExprInst, OnOffInst,
  CommandInst, CommandExpressionInst,
  UnsetInst, UnlockInst, SetInst,
  LazyGlobalInst, IfInst, ElseInst,
  UntilInst, FromInst, WhenInst,
  ReturnInst, BreakInst, SwitchInst,
  ForInst, OnInst, ToggleInst, WaitInst,
  LogInst, CopyInst, RenameInst,
  DeleteInst, RunInst, RunPathInst,
  RunPathOnceInst, CompileInst,
  ListInst, EmptyInst, PrintInst,
} from './inst';
import { DeclVariable, DeclLock, DeclFunction, DeclParameter } from './declare';
import { IToken } from '../entities/types';
import { Range } from 'vscode-languageserver';

export interface IParseError {
  tag: 'parseError';
  token: IToken;
  otherInfo: string[];
  message: string;
  inner: IParseError[];
}

export interface IExpr extends IExprVisitable {
  tag: 'expr';
  range: Range;
  toString(): string;
}

export interface IInst extends IInstVisitable {
  tag: 'inst';
  range: Range;
}

export interface IDeclScope {
  declare?: IToken;
  scope?: IToken;
  type: ScopeType;
  range: Range;
}

export interface IExprVisitable {
  accept<T>(visitor: IExprVisitor<T>): T;
}

export interface IExprVisitor<T> {
  visitBinary(expr: BinaryExpr): T;
  visitUnary(expr: UnaryExpr): T;
  visitFactor(expr: FactorExpr): T;
  visitSuffix(expr: SuffixExpr): T;
  visitCall(expr: CallExpr): T;
  visitArrayIndex(expr: ArrayIndexExpr): T;
  visitArrayBracket(expr: ArrayBracketExpr): T;
  visitDelegate(expr: DelegateExpr): T;
  visitLiteral(expr: LiteralExpr): T;
  visitVariable(expr: VariableExpr): T;
  visitGrouping(expr: GroupingExpr): T;
  visitAnonymousFunction(expr: AnonymousFunctionExpr): T;
}

export interface IInstVisitable {
  accept<T>(visitor: IInstVisitor<T>): T;
}

export interface IInstVisitor<T> {
  visitDeclVariable(decl: DeclVariable): T;
  visitDeclLock(decl: DeclLock): T;
  visitDeclFunction(decl: DeclFunction): T;
  visitDeclParameter(decl: DeclParameter): T;

  visitBlock(inst: BlockInst): T;
  visitExpr(inst: ExprInst): T;
  visitOnOff(inst: OnOffInst): T;
  visitCommand(inst: CommandInst): T;
  visitCommandExpr(inst: CommandExpressionInst): T;
  visitUnset(inst: UnsetInst): T;
  visitUnlock(inst: UnlockInst): T;
  visitSet(inst: SetInst): T;
  visitLazyGlobalInst(inst: LazyGlobalInst): T;
  visitIf(inst: IfInst): T;
  visitElse(inst: ElseInst): T;
  visitUntil(inst: UntilInst): T;
  visitFrom(inst: FromInst): T;
  visitWhen(inst: WhenInst): T;
  visitReturn(inst: ReturnInst): T;
  visitBreak(inst: BreakInst): T;
  visitSwitch(inst: SwitchInst): T;
  visitFor(inst: ForInst): T;
  visitOn(inst: OnInst): T;
  visitToggle(inst: ToggleInst): T;
  visitWait(inst: WaitInst): T;
  visitLog(inst: LogInst): T;
  visitCopy(inst: CopyInst): T;
  visitRename(inst: RenameInst): T;
  visitDelete(inst: DeleteInst): T;
  visitRun(inst: RunInst): T;
  visitRunPath(inst: RunPathInst): T;
  visitRunPathOnce(inst: RunPathOnceInst): T;
  visitCompile(inst: CompileInst): T;
  visitList(inst: ListInst): T;
  visitEmpty(inst: EmptyInst): T;
  visitPrint(inst: PrintInst): T;
}

export enum ScopeType {
  local,
  global,
}

export type Result<T> = T | IParseError;

export type ParseResult = Result<IExpr | IInst | IToken>;
export type ExprResult = Result<IExpr>;
export type InstResult = Result<IInst>;
export type StmtResult = Result<IInst>;
export type TokenResult = Result<IToken>;
