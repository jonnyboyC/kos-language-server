import * as Expr from './models/expr';
import * as Stmt from './models/stmt';
import * as SuffixTerm from './models/suffixTerm';
import { Var, Lock, Func, Param } from './models/declare';
import { Range, Location, Diagnostic } from 'vscode-languageserver';
import { TokenType } from '../models/tokentypes';
import { NodeBase } from './models/base';
import { Token } from '../models/token';

export interface RangeSequence extends Range {
  ranges: Range[];
}

export interface IDeclScope extends RangeSequence {
  declare?: Token;
  scope?: Token;
  type: ScopeKind;
  toString(): string;
}

export interface ITypeHint extends RangeSequence {
  typeHint: string;
  toString(): string;
}

export type NodeDataBuilder<T> = Partial<Writeable<NodeData<T>>>;

export type NodeData<T> = Properties<
  T,
  Token | NodeBase | NodeBase[] | ITypeHint | undefined
>;

export type SuffixTermTrailer =
  | SuffixTerm.Call
  | SuffixTerm.BracketIndex
  | SuffixTerm.HashIndex
  | SuffixTerm.Delegate;

export type Atom =
  | SuffixTerm.Literal
  | SuffixTerm.Identifier
  | SuffixTerm.Grouping
  | SuffixTerm.Invalid;

export interface IParameter extends RangeSequence {
  identifier: Token;
  toLines(): string[];
}

export enum SyntaxKind {
  script,
  stmt,
  expr,
  suffixTerm,
}

export interface IScript extends RangeSequence {
  lazyGlobal: boolean;
  stmts: IStmt[];
  runStmts: RunStmtType[];
  uri: string;
  toLocation(): Location;
  toLines(): string[];
  toString(): string;
  tag: SyntaxKind.script;
}

export interface IStmt extends IStmtVisitable, RangeSequence {
  toLocation(uri: string): Location;
  toLines(): string[];
  toString(): string;
  tag: SyntaxKind.stmt;
}

export interface IExpr extends IExprVisitable, RangeSequence {
  toLocation(uri: string): Location;
  toLines(): string[];
  toString(): string;
  tag: SyntaxKind.expr;
}

export interface ISuffixTerm extends ISuffixTermVisitable, RangeSequence {
  toLocation(uri: string): Location;
  toString(): string;
  tag: SyntaxKind.suffixTerm;
}

export interface IStmtClass
  extends Constructor<Stmt.Stmt>,
    IExprVisitableClass {
  grammar: GrammarNode[];
}

export interface IExprClass<T = Expr.Expr>
  extends Constructor<T>,
    IExprVisitableClass {
  grammar: GrammarNode[];
}

export interface ISuffixTermClass<T = SuffixTerm.SuffixTermBase>
  extends Constructor<T>,
    ISuffixTermVisitableClass {
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

export type Distribution =
  | INormalDistribution
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
  token: Token;
  message: string;
  inner: IParseError[];
}

export interface Ast {
  script: IScript;
  parseDiagnostics: Diagnostic[];
}

export interface IFindResult {
  node?: TreeNode;
  token: Token;
}

export interface INodeResult<T> {
  errors: IParseError[];
  value: T;
}

export enum ScopeKind {
  local,
  global,
}

export type PartialNode = {
  [key: string]: Token | TreeNode | undefined;
};

export type GrammarNode =
  | IExprClass
  | IStmtClass
  | ISuffixTermClass
  | TokenType
  | IGrammarOptional
  | IGrammarRepeat
  | IGrammarUnion;

export type RunStmtType = Stmt.Run | Stmt.RunPath | Stmt.RunOncePath;
export type ScriptNode = IStmt | IExpr | ISuffixTerm;
export type TreeNode =
  | IScript
  | IStmt
  | IExpr
  | ISuffixTerm
  | IParameter
  | IDeclScope
  | ITypeHint;

export interface IExprVisitable {
  accept<T extends (...args: any) => any>(
    visitor: IExprVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T>;
}

export interface IExprVisitor<T extends (...args: any) => any> {
  visitExprInvalid(
    expr: Expr.Invalid,
    parameters: Parameters<T>,
  ): ReturnType<T>;
  visitTernary(expr: Expr.Ternary, parameters: Parameters<T>): ReturnType<T>;
  visitBinary(expr: Expr.Binary, parameters: Parameters<T>): ReturnType<T>;
  visitUnary(expr: Expr.Unary, parameters: Parameters<T>): ReturnType<T>;
  visitFactor(expr: Expr.Factor, parameters: Parameters<T>): ReturnType<T>;
  visitSuffix(expr: Expr.Suffix, parameters: Parameters<T>): ReturnType<T>;
  visitLambda(expr: Expr.Lambda, parameters: Parameters<T>): ReturnType<T>;
}

export interface ISuffixTermVisitable {
  accept<T extends (...args: any) => any>(
    visitor: ISuffixTermVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T>;
}

export interface ISuffixTermVisitor<T extends (...args: any) => any> {
  visitSuffixTermInvalid(
    suffixTerm: SuffixTerm.Invalid,
    parameters: Parameters<T>,
  ): ReturnType<T>;
  visitSuffixTrailer(
    suffixTerm: SuffixTerm.SuffixTrailer,
    parameters: Parameters<T>,
  ): ReturnType<T>;
  visitSuffixTerm(
    suffixTerm: SuffixTerm.SuffixTerm,
    parameters: Parameters<T>,
  ): ReturnType<T>;
  visitCall(
    suffixTerm: SuffixTerm.Call,
    parameters: Parameters<T>,
  ): ReturnType<T>;
  visitHashIndex(
    suffixTerm: SuffixTerm.HashIndex,
    parameters: Parameters<T>,
  ): ReturnType<T>;
  visitBracketIndex(
    suffixTerm: SuffixTerm.BracketIndex,
    parameters: Parameters<T>,
  ): ReturnType<T>;
  visitDelegate(
    suffixTerm: SuffixTerm.Delegate,
    parameters: Parameters<T>,
  ): ReturnType<T>;
  visitLiteral(
    suffixTerm: SuffixTerm.Literal,
    parameters: Parameters<T>,
  ): ReturnType<T>;
  visitIdentifier(
    suffixTerm: SuffixTerm.Identifier,
    parameters: Parameters<T>,
  ): ReturnType<T>;
  visitGrouping(
    suffixTerm: SuffixTerm.Grouping,
    parameters: Parameters<T>,
  ): ReturnType<T>;
}

export interface IExprVisitableClass {
  classAccept<T>(visitor: IExprClassVisitor<T>): T;
}

export interface IExprClassVisitor<T> {
  visitExprInvalid(exprClass: Constructor<Expr.Invalid>): T;
  visitTernary(exprClass: Constructor<Expr.Ternary>): T;
  visitBinary(exprClass: Constructor<Expr.Binary>): T;
  visitUnary(exprClass: Constructor<Expr.Unary>): T;
  visitFactor(exprClass: Constructor<Expr.Factor>): T;
  visitSuffix(exprClass: Constructor<Expr.Suffix>): T;
  visitAnonymousFunction(exprClass: Constructor<Expr.Lambda>): T;
}

export interface ISuffixTermVisitableClass {
  classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T;
}

export interface ISuffixTermClassVisitor<T> {
  visitSuffixTermInvalid(suffixTerm: Constructor<SuffixTerm.Invalid>): T;
  visitSuffixTrailer(termClass: Constructor<SuffixTerm.SuffixTrailer>): T;
  visitSuffixTerm(termClass: Constructor<SuffixTerm.SuffixTerm>): T;
  visitCall(termClass: Constructor<SuffixTerm.Call>): T;
  visitHashIndex(termClass: Constructor<SuffixTerm.HashIndex>): T;
  visitBracketIndex(termClass: Constructor<SuffixTerm.BracketIndex>): T;
  visitDelegate(termClass: Constructor<SuffixTerm.Delegate>): T;
  visitLiteral(termClass: Constructor<SuffixTerm.Literal>): T;
  visitIdentifier(termClass: Constructor<SuffixTerm.Identifier>): T;
  visitGrouping(termClass: Constructor<SuffixTerm.Grouping>): T;
}

export interface IStmtVisitable {
  accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T>;
}

export interface IStmtVisitor<T extends (...args: any) => any> {
  visitDeclVariable(decl: Var, parameters: Parameters<T>): ReturnType<T>;
  visitDeclLock(decl: Lock, parameters: Parameters<T>): ReturnType<T>;
  visitDeclFunction(decl: Func, parameters: Parameters<T>): ReturnType<T>;
  visitDeclParameter(decl: Param, parameters: Parameters<T>): ReturnType<T>;

  visitStmtInvalid(
    stmt: Stmt.Invalid,
    parameters: Parameters<T>,
  ): ReturnType<T>;
  visitBlock(stmt: Stmt.Block, parameters: Parameters<T>): ReturnType<T>;
  visitExpr(stmt: Stmt.ExprStmt, parameters: Parameters<T>): ReturnType<T>;
  visitOnOff(stmt: Stmt.OnOff, parameters: Parameters<T>): ReturnType<T>;
  visitCommand(stmt: Stmt.Command, parameters: Parameters<T>): ReturnType<T>;
  visitCommandExpr(
    stmt: Stmt.CommandExpr,
    parameters: Parameters<T>,
  ): ReturnType<T>;
  visitUnset(stmt: Stmt.Unset, parameters: Parameters<T>): ReturnType<T>;
  visitUnlock(stmt: Stmt.Unlock, parameters: Parameters<T>): ReturnType<T>;
  visitSet(stmt: Stmt.Set, parameters: Parameters<T>): ReturnType<T>;
  visitLazyGlobal(
    stmt: Stmt.LazyGlobal,
    parameters: Parameters<T>,
  ): ReturnType<T>;
  visitIf(stmt: Stmt.If, parameters: Parameters<T>): ReturnType<T>;
  visitElse(stmt: Stmt.Else, parameters: Parameters<T>): ReturnType<T>;
  visitUntil(stmt: Stmt.Until, parameters: Parameters<T>): ReturnType<T>;
  visitFrom(stmt: Stmt.From, parameters: Parameters<T>): ReturnType<T>;
  visitWhen(stmt: Stmt.When, parameters: Parameters<T>): ReturnType<T>;
  visitReturn(stmt: Stmt.Return, parameters: Parameters<T>): ReturnType<T>;
  visitBreak(stmt: Stmt.Break, parameters: Parameters<T>): ReturnType<T>;
  visitSwitch(stmt: Stmt.Switch, parameters: Parameters<T>): ReturnType<T>;
  visitFor(stmt: Stmt.For, parameters: Parameters<T>): ReturnType<T>;
  visitOn(stmt: Stmt.On, parameters: Parameters<T>): ReturnType<T>;
  visitToggle(stmt: Stmt.Toggle, parameters: Parameters<T>): ReturnType<T>;
  visitWait(stmt: Stmt.Wait, parameters: Parameters<T>): ReturnType<T>;
  visitLog(stmt: Stmt.Log, parameters: Parameters<T>): ReturnType<T>;
  visitCopy(stmt: Stmt.Copy, parameters: Parameters<T>): ReturnType<T>;
  visitRename(stmt: Stmt.Rename, parameters: Parameters<T>): ReturnType<T>;
  visitDelete(stmt: Stmt.Delete, parameters: Parameters<T>): ReturnType<T>;
  visitRun(stmt: Stmt.Run, parameters: Parameters<T>): ReturnType<T>;
  visitRunPath(stmt: Stmt.RunPath, parameters: Parameters<T>): ReturnType<T>;
  visitRunPathOnce(
    stmt: Stmt.RunOncePath,
    parameters: Parameters<T>,
  ): ReturnType<T>;
  visitCompile(stmt: Stmt.Compile, parameters: Parameters<T>): ReturnType<T>;
  visitList(stmt: Stmt.List, parameters: Parameters<T>): ReturnType<T>;
  visitEmpty(stmt: Stmt.Empty, parameters: Parameters<T>): ReturnType<T>;
  visitPrint(stmt: Stmt.Print, parameters: Parameters<T>): ReturnType<T>;
}
