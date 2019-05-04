import * as Expr from './expr';
import * as Inst from './inst';
import * as SuffixTerm from './suffixTerm';
import { Var, Lock, Func, Param } from './declare';
import { IToken } from '../entities/types';
import { Range, Location, Diagnostic } from 'vscode-languageserver';
import { TokenType } from '../entities/tokentypes';

export interface IRangeSequence extends Range {
  ranges: Range[];
}

export interface IDeclScope extends IRangeSequence {
  declare?: IToken;
  scope?: IToken;
  type: ScopeType;
  toString(): string;
}

export type SuffixTermTrailer = SuffixTerm.Call
  | SuffixTerm.ArrayBracket
  | SuffixTerm.ArrayIndex
  | SuffixTerm.Delegate;

export type Atom = SuffixTerm.Literal
  | SuffixTerm.Identifier
  | SuffixTerm.Grouping;

export interface IParameter extends IRangeSequence {
  identifier: IToken;
  toLines(): string[];
}

export enum SyntaxKind {
  script,
  inst,
  expr,
  suffixTerm,
}

export interface IScript extends IRangeSequence {
  lazyGlobal: boolean;
  insts: IInst[];
  runInsts: RunInstType[];
  uri: string;
  toLocation(): Location;
  toLines(): string[];
  toString(): string;
  tag: SyntaxKind.script;
}

export interface IInst extends
  IInstVisitable,
  IInstPassable,
  IRangeSequence {
  toLocation(uri: string): Location;
  toLines(): string[];
  toString(): string;
  tag: SyntaxKind.inst;
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

export interface IInstClass extends
  Constructor<Inst.Inst>,
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
  token: IToken;
  otherInfo: string[];
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
  | IInstClass | ISuffixTermClass | TokenType
  | IGrammarOptional | IGrammarRepeat | IGrammarUnion;

export type RunInstType = Inst.Run | Inst.RunPath | Inst.RunPathOnce;
export type ScriptNode = IInst | IExpr | ISuffixTerm;
export type TreeNode = IScript | IInst | IExpr | ISuffixTerm | IParameter | IDeclScope;

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
  visitExpr(inst: Inst.ExprInst): T;
  visitOnOff(inst: Inst.OnOff): T;
  visitCommand(inst: Inst.Command): T;
  visitCommandExpr(inst: Inst.CommandExpr): T;
  visitUnset(inst: Inst.Unset): T;
  visitUnlock(inst: Inst.Unlock): T;
  visitSet(inst: Inst.Set): T;
  visitLazyGlobal(inst: Inst.LazyGlobal): T;
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

export interface IInstPassable {
  pass<T>(visitor: IInstPasser<T>): T;
}

export interface IInstPasser<T> {
  passDeclVariable(decl: Var): T;
  passDeclLock(decl: Lock): T;
  passDeclFunction(decl: Func): T;
  passDeclParameter(decl: Param): T;

  passInstInvalid(inst: Inst.Invalid): T;
  passBlock(inst: Inst.Block): T;
  passExpr(inst: Inst.ExprInst): T;
  passOnOff(inst: Inst.OnOff): T;
  passCommand(inst: Inst.Command): T;
  passCommandExpr(inst: Inst.CommandExpr): T;
  passUnset(inst: Inst.Unset): T;
  passUnlock(inst: Inst.Unlock): T;
  passSet(inst: Inst.Set): T;
  passLazyGlobal(inst: Inst.LazyGlobal): T;
  passIf(inst: Inst.If): T;
  passElse(inst: Inst.Else): T;
  passUntil(inst: Inst.Until): T;
  passFrom(inst: Inst.From): T;
  passWhen(inst: Inst.When): T;
  passReturn(inst: Inst.Return): T;
  passBreak(inst: Inst.Break): T;
  passSwitch(inst: Inst.Switch): T;
  passFor(inst: Inst.For): T;
  passOn(inst: Inst.On): T;
  passToggle(inst: Inst.Toggle): T;
  passWait(inst: Inst.Wait): T;
  passLog(inst: Inst.Log): T;
  passCopy(inst: Inst.Copy): T;
  passRename(inst: Inst.Rename): T;
  passDelete(inst: Inst.Delete): T;
  passRun(inst: Inst.Run): T;
  passRunPath(inst: Inst.RunPath): T;
  passRunPathOnce(inst: Inst.RunPathOnce): T;
  passCompile(inst: Inst.Compile): T;
  passList(inst: Inst.List): T;
  passEmpty(inst: Inst.Empty): T;
  passPrint(inst: Inst.Print): T;
}
