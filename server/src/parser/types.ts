import * as Expr from './expr';
import * as Stmt from './stmt';
import * as SuffixTerm from './suffixTerm';
import { Var, Lock, Func, Param } from './declare';
import { Range, Location, Diagnostic } from 'vscode-languageserver';
import { TokenType } from '../entities/tokentypes';
import { NodeBase } from './base';
import { Token } from '../entities/token';

export interface IRangeSequence extends Range {
  ranges: Range[];
}

export interface IDeclScope extends IRangeSequence {
  declare?: Token;
  scope?: Token;
  type: ScopeKind;
  toString(): string;
}

export type NodeDataBuilder<T> = Partial<Writeable<NodeData<T>>>;

export type NodeData<T> = Properties<T, Token | NodeBase | NodeBase[] | undefined>;

export type SuffixTermTrailer = SuffixTerm.Call
  | SuffixTerm.ArrayBracket
  | SuffixTerm.ArrayIndex
  | SuffixTerm.Delegate;

export type Atom = SuffixTerm.Literal
  | SuffixTerm.Identifier
  | SuffixTerm.Grouping
  | SuffixTerm.Invalid;

export interface IParameter extends IRangeSequence {
  identifier: Token;
  toLines(): string[];
}

export enum SyntaxKind {
  script,
  stmt,
  expr,
  suffixTerm,
}

export interface IScript extends IRangeSequence {
  lazyGlobal: boolean;
  stmts: IStmt[];
  runStmts: RunStmtType[];
  uri: string;
  toLocation(): Location;
  toLines(): string[];
  toString(): string;
  tag: SyntaxKind.script;
}

export interface IStmt extends
  IStmtVisitable,
  IStmtPassable,
  IRangeSequence {
  toLocation(uri: string): Location;
  toLines(): string[];
  toString(): string;
  tag: SyntaxKind.stmt;
}

export interface IExpr extends
  IExprVisitable,
  IExprPassable,
  IRangeSequence {
  toLocation(uri: string): Location;
  toLines(): string[];
  toString(): string;
  tag: SyntaxKind.expr;
}

export interface ISuffixTerm extends
  ISuffixTermPassable,
  ISuffixTermVisitable,
  ISuffixTermParamVisitable,
  IRangeSequence {
  toLocation(uri: string): Location;
  toString(): string;
  tag: SyntaxKind.suffixTerm;
}

export interface IStmtClass extends
  Constructor<Stmt.Stmt>,
  IExprVisitableClass {
  grammar: GrammarNode[];
}

export interface IExprClass<T = Expr.Expr> extends
  Constructor<T>,
  IExprVisitableClass {
  grammar: GrammarNode[];
}

export interface ISuffixTermClass<T = SuffixTerm.SuffixTermBase> extends
  Constructor<T>,
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
  token: Token;
  message: string;
  inner: IParseError[];
}

export interface IParseResult {
  script: IScript;
  parseErrors: IParseError[];
}

export interface ScriptResult extends IParseResult {
  scanErrors: Diagnostic[];
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

export type GrammarNode = IExprClass
  | IStmtClass | ISuffixTermClass | TokenType
  | IGrammarOptional | IGrammarRepeat | IGrammarUnion;

export type RunStmtType = Stmt.Run | Stmt.RunPath | Stmt.RunOncePath;
export type ScriptNode = IStmt | IExpr | ISuffixTerm;
export type TreeNode = IScript | IStmt | IExpr | ISuffixTerm | IParameter | IDeclScope;

export interface IExprVisitable {
  accept<T>(visitor: IExprVisitor<T>): T;
}

export interface IExprVisitor<T> {
  visitExprInvalid(expr: Expr.Invalid): T;
  visitBinary(expr: Expr.Binary): T;
  visitUnary(expr: Expr.Unary): T;
  visitFactor(expr: Expr.Factor): T;
  visitSuffix(expr: Expr.Suffix): T;
  visitLambda(expr: Expr.Lambda): T;
}

export interface IExprPassable {
  pass<T>(visitor: IExprPasser<T>): T;
}

export interface IExprPasser<T> {
  passExprInvalid(expr: Expr.Invalid): T;
  passBinary(expr: Expr.Binary): T;
  passUnary(expr: Expr.Unary): T;
  passFactor(expr: Expr.Factor): T;
  passSuffix(expr: Expr.Suffix): T;
  passAnonymousFunction(expr: Expr.Lambda): T;
}

export interface ISuffixTermVisitable {
  accept<T>(visitor: ISuffixTermVisitor<T>): T;
}

export interface ISuffixTermVisitor<T> {
  visitSuffixTermInvalid(suffixTerm: SuffixTerm.Invalid): T;
  visitSuffixTrailer(suffixTerm: SuffixTerm.SuffixTrailer): T;
  visitSuffixTerm(suffixTerm: SuffixTerm.SuffixTerm): T;
  visitCall(suffixTerm: SuffixTerm.Call): T;
  visitArrayIndex(suffixTerm: SuffixTerm.ArrayIndex): T;
  visitArrayBracket(suffixTerm: SuffixTerm.ArrayBracket): T;
  visitDelegate(suffixTerm: SuffixTerm.Delegate): T;
  visitLiteral(suffixTerm: SuffixTerm.Literal): T;
  visitIdentifier(suffixTerm: SuffixTerm.Identifier): T;
  visitGrouping(suffixTerm: SuffixTerm.Grouping): T;
}

export interface ISuffixTermPassable {
  pass<T>(visitor: ISuffixTermPasser<T>): T;
}

export interface ISuffixTermPasser<T> {
  passSuffixTermInvalid(suffixTerm: SuffixTerm.Invalid): T;
  passSuffixTrailer(suffixTerm: SuffixTerm.SuffixTrailer): T;
  passSuffixTerm(suffixTerm: SuffixTerm.SuffixTerm): T;
  passCall(suffixTerm: SuffixTerm.Call): T;
  passArrayIndex(suffixTerm: SuffixTerm.ArrayIndex): T;
  passArrayBracket(suffixTerm: SuffixTerm.ArrayBracket): T;
  passDelegate(suffixTerm: SuffixTerm.Delegate): T;
  passLiteral(suffixTerm: SuffixTerm.Literal): T;
  passIdentifier(suffixTerm: SuffixTerm.Identifier): T;
  passGrouping(suffixTerm: SuffixTerm.Grouping): T;
}

export interface ISuffixTermParamVisitable {
  acceptParam<TParam, TReturn>(
    visitor: ISuffixTermParamVisitor<TParam, TReturn>,
    param: TParam): TReturn;
}

export interface ISuffixTermParamVisitor<TParam, TReturn> {
  visitSuffixTermInvalid(suffixTerm: SuffixTerm.Invalid, param: TParam): TReturn;
  visitSuffixTrailer(suffixTerm: SuffixTerm.SuffixTrailer, param: TParam): TReturn;
  visitSuffixTerm(suffixTerm: SuffixTerm.SuffixTerm, param: TParam): TReturn;
  visitCall(suffixTerm: SuffixTerm.Call, param: TParam): TReturn;
  visitArrayIndex(suffixTerm: SuffixTerm.ArrayIndex, param: TParam): TReturn;
  visitArrayBracket(suffixTerm: SuffixTerm.ArrayBracket, param: TParam): TReturn;
  visitDelegate(suffixTerm: SuffixTerm.Delegate, param: TParam): TReturn;
  visitLiteral(suffixTerm: SuffixTerm.Literal, param: TParam): TReturn;
  visitIdentifier(suffixTerm: SuffixTerm.Identifier, param: TParam): TReturn;
  visitGrouping(suffixTerm: SuffixTerm.Grouping, param: TParam): TReturn;
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
  visitArrayIndex(termClass: Constructor<SuffixTerm.ArrayIndex>): T;
  visitArrayBracket(termClass: Constructor<SuffixTerm.ArrayBracket>): T;
  visitDelegate(termClass: Constructor<SuffixTerm.Delegate>): T;
  visitLiteral(termClass: Constructor<SuffixTerm.Literal>): T;
  visitVariable(termClass: Constructor<SuffixTerm.Identifier>): T;
  visitGrouping(termClass: Constructor<SuffixTerm.Grouping>): T;
}

export interface IStmtVisitable {
  accept<T>(visitor: IStmtVisitor<T>): T;
}

export interface IStmtVisitor<T> {
  visitDeclVariable(decl: Var): T;
  visitDeclLock(decl: Lock): T;
  visitDeclFunction(decl: Func): T;
  visitDeclParameter(decl: Param): T;

  visitStmtInvalid(stmt: Stmt.Invalid): T;
  visitBlock(stmt: Stmt.Block): T;
  visitExpr(stmt: Stmt.ExprStmt): T;
  visitOnOff(stmt: Stmt.OnOff): T;
  visitCommand(stmt: Stmt.Command): T;
  visitCommandExpr(stmt: Stmt.CommandExpr): T;
  visitUnset(stmt: Stmt.Unset): T;
  visitUnlock(stmt: Stmt.Unlock): T;
  visitSet(stmt: Stmt.Set): T;
  visitLazyGlobal(stmt: Stmt.LazyGlobal): T;
  visitIf(stmt: Stmt.If): T;
  visitElse(stmt: Stmt.Else): T;
  visitUntil(stmt: Stmt.Until): T;
  visitFrom(stmt: Stmt.From): T;
  visitWhen(stmt: Stmt.When): T;
  visitReturn(stmt: Stmt.Return): T;
  visitBreak(stmt: Stmt.Break): T;
  visitSwitch(stmt: Stmt.Switch): T;
  visitFor(stmt: Stmt.For): T;
  visitOn(stmt: Stmt.On): T;
  visitToggle(stmt: Stmt.Toggle): T;
  visitWait(stmt: Stmt.Wait): T;
  visitLog(stmt: Stmt.Log): T;
  visitCopy(stmt: Stmt.Copy): T;
  visitRename(stmt: Stmt.Rename): T;
  visitDelete(stmt: Stmt.Delete): T;
  visitRun(stmt: Stmt.Run): T;
  visitRunPath(stmt: Stmt.RunPath): T;
  visitRunPathOnce(stmt: Stmt.RunOncePath): T;
  visitCompile(stmt: Stmt.Compile): T;
  visitList(stmt: Stmt.List): T;
  visitEmpty(stmt: Stmt.Empty): T;
  visitPrint(stmt: Stmt.Print): T;
}

export interface IStmtPassable {
  pass<T>(visitor: IStmtPasser<T>): T;
}

export interface IStmtPasser<T> {
  passDeclVariable(decl: Var): T;
  passDeclLock(decl: Lock): T;
  passDeclFunction(decl: Func): T;
  passDeclParameter(decl: Param): T;

  passStmtInvalid(stmt: Stmt.Invalid): T;
  passBlock(stmt: Stmt.Block): T;
  passExpr(stmt: Stmt.ExprStmt): T;
  passOnOff(stmt: Stmt.OnOff): T;
  passCommand(stmt: Stmt.Command): T;
  passCommandExpr(stmt: Stmt.CommandExpr): T;
  passUnset(stmt: Stmt.Unset): T;
  passUnlock(stmt: Stmt.Unlock): T;
  passSet(stmt: Stmt.Set): T;
  passLazyGlobal(stmt: Stmt.LazyGlobal): T;
  passIf(stmt: Stmt.If): T;
  passElse(stmt: Stmt.Else): T;
  passUntil(stmt: Stmt.Until): T;
  passFrom(stmt: Stmt.From): T;
  passWhen(stmt: Stmt.When): T;
  passReturn(stmt: Stmt.Return): T;
  passBreak(stmt: Stmt.Break): T;
  passSwitch(stmt: Stmt.Switch): T;
  passFor(stmt: Stmt.For): T;
  passOn(stmt: Stmt.On): T;
  passToggle(stmt: Stmt.Toggle): T;
  passWait(stmt: Stmt.Wait): T;
  passLog(stmt: Stmt.Log): T;
  passCopy(stmt: Stmt.Copy): T;
  passRename(stmt: Stmt.Rename): T;
  passDelete(stmt: Stmt.Delete): T;
  passRun(stmt: Stmt.Run): T;
  passRunPath(stmt: Stmt.RunPath): T;
  passRunPathOnce(stmt: Stmt.RunOncePath): T;
  passCompile(stmt: Stmt.Compile): T;
  passList(stmt: Stmt.List): T;
  passEmpty(stmt: Stmt.Empty): T;
  passPrint(stmt: Stmt.Print): T;
}
