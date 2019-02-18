import * as Expr from './expr';
import * as Inst from './inst';
import { Var, Lock, Func, Param } from './declare';
import { IToken } from '../entities/types';
import { Range } from 'vscode-languageserver';
import { IScannerError } from '../scanner/types';
import { TokenType } from '../entities/tokentypes';

export interface IRangeSequence extends Range {
  ranges: Range[];
}

export interface IDeclScope extends Range {
  declare?: IToken;
  scope?: IToken;
  type: ScopeType;
}

export interface ISuffix extends IExpr {
  isSuffix: true;
}

export type SuffixTermTrailer = Expr.Call | Expr.ArrayBracket | Expr.ArrayIndex | Expr.Delegate;
export type Atom = Expr.Literal | Expr.Identifier | Expr.Grouping;

export interface IExpr extends IExprVisitable, IRangeSequence {
  tag: 'expr';
  toString(): string;
}

export interface IInst extends IInstVisitable, IRangeSequence {
  tag: 'inst';
}

export interface IScript extends IRangeSequence {
  insts: IInst[];
  tag: 'script';
}

export interface IExprClass<T = Expr.Expr> extends Constructor<T>, IExprVisitableClass {
  grammar: GrammarNode[];
}

export interface IInstClass extends Constructor<Inst.Inst>, IExprVisitableClass {
  grammar: GrammarNode[];
}

export interface IGrammarOptional {
  nodes: GrammarNode[];
  dist: Distribution;
  tag: 'optional';
}

export interface IGrammarRepeat {
  nodes: GrammarNode[];
  dist: Distribution;
  tag: 'repeat';
}

export interface IGrammarUnion {
  node: [GrammarNode, Distribution][];
  tag: 'union';
}

export type Distribution = INormalDistribution
  | IGammaDistribution
  | IExponentialDistribution
  | IConstantDistribution;

export interface INormalDistribution {
  mean: number;
  std: number;
  tag: 'normal';
}

export interface IGammaDistribution {
  shape: number;
  scale: number;
  tag: 'gamma';
}

export interface IExponentialDistribution {
  rate: number;
  tag: 'exp';
}

export interface IConstantDistribution {
  value: number;
  tag: 'constant';
}

export interface IParseError extends Range {
  tag: 'parseError';
  token: IToken;
  otherInfo: string[];
  message: string;
  inner: IParseError[];
}

export interface ParseResult {
  script: IScript;
  runInsts: RunInstType[];
  parseErrors: IParseError[];
}

export interface ScriptResult extends ParseResult {
  scanErrors: IScannerError[];
}

export interface IFindResult {
  node?: TreeNode;
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

export type GrammarNode = IExprClass
  | IInstClass | TokenType
  | IGrammarOptional | IGrammarRepeat | IGrammarUnion;

export type RunInstType = Inst.Run | Inst.RunPath | Inst.RunPathOnce;
export type TreeNode = IExpr | IInst | IScript;

export interface IExprVisitable {
  accept<T>(visitor: IExprVisitor<T>): T;
}

export interface IExprVisitor<T> {
  visitExprInvalid(expr: Expr.Invalid): T;
  visitBinary(expr: Expr.Binary): T;
  visitUnary(expr: Expr.Unary): T;
  visitFactor(expr: Expr.Factor): T;
  visitSuffix(expr: Expr.Suffix): T;
  visitSuffixTerm(expr: Expr.SuffixTerm): T;
  visitCall(expr: Expr.Call): T;
  visitArrayIndex(expr: Expr.ArrayIndex): T;
  visitArrayBracket(expr: Expr.ArrayBracket): T;
  visitDelegate(expr: Expr.Delegate): T;
  visitLiteral(expr: Expr.Literal): T;
  visitVariable(expr: Expr.Identifier): T;
  visitGrouping(expr: Expr.Grouping): T;
  visitAnonymousFunction(expr: Expr.AnonymousFunction): T;
}

export interface IExprVisitableClass {
  classAccept<T>(visitor: IExprClassVisitor<T>): T;
}

export interface IExprClassVisitor<T> {
  visitExprInvalid(exprClass: Constructor<Expr.Invalid>): T;
  visitBinary(exprClass: Constructor<Expr.Binary>): T;
  visitUnary(exprClass: Constructor<Expr.Unary>): T;
  visitFactor(exprClass: Constructor<Expr.Factor>): T;
  visitSuffix(exprClass: Constructor<Expr.Suffix>): T;
  visitSuffixTerm(expr: Constructor<Expr.SuffixTerm>): T;
  visitCall(exprClass: Constructor<Expr.Call>): T;
  visitArrayIndex(exprClass: Constructor<Expr.ArrayIndex>): T;
  visitArrayBracket(exprClass: Constructor<Expr.ArrayBracket>): T;
  visitDelegate(exprClass: Constructor<Expr.Delegate>): T;
  visitLiteral(exprClass: Constructor<Expr.Literal>): T;
  visitVariable(exprClass: Constructor<Expr.Identifier>): T;
  visitGrouping(exprClass: Constructor<Expr.Grouping>): T;
  visitAnonymousFunction(exprClass: Constructor<Expr.AnonymousFunction>): T;
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
