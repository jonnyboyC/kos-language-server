import * as Expr from './expr';
import * as Inst from './inst';
import { Var, Lock, Func, Param } from './declare';
import { IToken } from '../entities/types';
import { Range } from 'vscode-languageserver';
import { SyntaxTree } from '../entities/syntaxTree';
import { IScannerError } from '../scanner/types';

export interface IParseError extends Range {
  tag: 'parseError';
  token: IToken;
  otherInfo: string[];
  message: string;
  inner: IParseError[];
}

export interface ParseResult {
  syntaxTree: SyntaxTree;
  runInsts: RunInstType[];
  parseErrors: IParseError[];
}

export interface SyntaxTreeResult extends ParseResult {
  scanErrors: IScannerError[];
}

export type RunInstType = Inst.Run | Inst.RunPath | Inst.RunPathOnce;

export interface IRangeSequence extends Range {
  ranges: Range[];
}

export interface ISuffix extends IExpr {
  isSuffix: true;
}

export interface IExpr extends IExprVisitable, IRangeSequence {
  tag: 'expr';
  toString(): string;
}

export interface IExprClass extends Constructor<IExpr> {
  classAccept<T>(visitor: IExprClassVisitor<T>): T;
}

export interface IInst extends IInstVisitable, IRangeSequence {
  tag: 'inst';
}

export interface IDeclScope extends Range {
  declare?: IToken;
  scope?: IToken;
  type: ScopeType;
}

export interface IExprVisitable {
  accept<T>(visitor: IExprVisitor<T>): T;
}

export interface IExprVisitor<T> {
  visitExprInvalid(expr: Expr.Invalid): T;
  visitBinary(expr: Expr.Binary): T;
  visitUnary(expr: Expr.Unary): T;
  visitFactor(expr: Expr.Factor): T;
  visitSuffix(expr: Expr.Suffix): T;
  visitCall(expr: Expr.Call): T;
  visitArrayIndex(expr: Expr.ArrayIndex): T;
  visitArrayBracket(expr: Expr.ArrayBracket): T;
  visitDelegate(expr: Expr.Delegate): T;
  visitLiteral(expr: Expr.Literal): T;
  visitVariable(expr: Expr.Variable): T;
  visitGrouping(expr: Expr.Grouping): T;
  visitAnonymousFunction(expr: Expr.AnonymousFunction): T;
}

export interface IExprClassVisitor<T> {
  visitExprInvalid(expr: Constructor<Expr.Invalid>): T;
  visitBinary(expr: Constructor<Expr.Binary>): T;
  visitUnary(expr: Constructor<Expr.Unary>): T;
  visitFactor(expr: Constructor<Expr.Factor>): T;
  visitSuffix(expr: Constructor<Expr.Suffix>): T;
  visitCall(expr: Constructor<Expr.Call>): T;
  visitArrayIndex(expr: Constructor<Expr.ArrayIndex>): T;
  visitArrayBracket(expr: Constructor<Expr.ArrayBracket>): T;
  visitDelegate(expr: Constructor<Expr.Delegate>): T;
  visitLiteral(expr: Constructor<Expr.Literal>): T;
  visitVariable(expr: Constructor<Expr.Variable>): T;
  visitGrouping(expr: Constructor<Expr.Grouping>): T;
  visitAnonymousFunction(expr: Constructor<Expr.AnonymousFunction>): T;
}

export interface IInstVisitable {
  accept<T>(visitor: IInstVisitor<T>): T;
}

export interface IInstVisitor<T> {
  visitDeclVariable(decl: Var): T;
  visitDeclLock(decl: Lock): T;
  visitDeclFunction(decl: Func): T;
  visitDeclParameter(decl: Param): T;

  visitInstInvalid(inst: Inst.Invalid): T;
  visitBlock(inst: Inst.Block): T;
  visitExpr(inst: Inst.Expr): T;
  visitOnOff(inst: Inst.OnOff): T;
  visitCommand(inst: Inst.Command): T;
  visitCommandExpr(inst: Inst.CommandExpr): T;
  visitUnset(inst: Inst.Unset): T;
  visitUnlock(inst: Inst.Unlock): T;
  visitSet(inst: Inst.Set): T;
  visitLazyGlobalInst(inst: Inst.LazyGlobal): T;
  visitIf(inst: Inst.If): T;
  visitElse(inst: Inst.Else): T;
  visitUntil(inst: Inst.Until): T;
  visitFrom(inst: Inst.From): T;
  visitWhen(inst: Inst.When): T;
  visitReturn(inst: Inst.Return): T;
  visitBreak(inst: Inst.Break): T;
  visitSwitch(inst: Inst.Switch): T;
  visitFor(inst: Inst.For): T;
  visitOn(inst: Inst.On): T;
  visitToggle(inst: Inst.Toggle): T;
  visitWait(inst: Inst.Wait): T;
  visitLog(inst: Inst.Log): T;
  visitCopy(inst: Inst.Copy): T;
  visitRename(inst: Inst.Rename): T;
  visitDelete(inst: Inst.Delete): T;
  visitRun(inst: Inst.Run): T;
  visitRunPath(inst: Inst.RunPath): T;
  visitRunPathOnce(inst: Inst.RunPathOnce): T;
  visitCompile(inst: Inst.Compile): T;
  visitList(inst: Inst.List): T;
  visitEmpty(inst: Inst.Empty): T;
  visitPrint(inst: Inst.Print): T;
}

export interface IFindResult {
  node?: INode;
  token: IToken;
}

export interface INodeResult<T> {
  errors: IParseError[];
  value: T;
}

export enum ScopeType {
  local,
  global,
}

export type Result<T> = T | IParseError;
export type INode = IExpr | IInst | SyntaxTree;

export type ExprResult = Result<IExpr>;
export type InstResult = Result<IInst>;
export type TokenResult = Result<IToken>;
