import { IExpr, IInst, IExprVisitor } from './types';
import { TokenType } from '../entities/tokentypes';
import { IToken } from '../entities/types';
import { Range, Position } from 'vscode-languageserver';

export abstract class Expr implements IExpr {
  get tag(): 'expr' {
    return 'expr';
  }

  public abstract get ranges(): Range[];
  public abstract toString(): string;
  public abstract get start(): Position;
  public abstract get end(): Position;
  public abstract accept<T>(visitor: IExprVisitor<T>): T;
}

export class InvalidExpr extends Expr {
  constructor(public readonly tokens: IToken[]) {
    super();
  }

  public get start(): Position {
    return this.tokens[0].start;
  }

  public get end(): Position {
    return this.tokens[this.tokens.length - 1].end;
  }

  public get ranges(): Range[] {
    return [...this.tokens];
  }

  public toString(): string {
    return this.tokens.join(', ');
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitExprInvalid(this);
  }
}

export class BinaryExpr extends Expr {
  constructor(
    public readonly left: IExpr,
    public readonly operator: IToken,
    public readonly right: IExpr) {
    super();
  }

  public get start(): Position {
    return this.left.start;
  }

  public get end(): Position {
    return this.right.end;
  }

  public get ranges(): Range[] {
    return [this.left, this.operator, this.right];
  }

  public toString(): string {
    return `${this.left.toString()} ${this.operator.lexeme} ${this.right.toString()}`;
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitBinary(this);
  }
}

export class UnaryExpr extends Expr {
  constructor(
    public readonly operator: IToken,
    public readonly factor: IExpr) {
    super();
  }

  public get start(): Position {
    return this.operator.start;
  }

  public get end(): Position {
    return this.factor.end;
  }

  public get ranges(): Range[] {
    return [this.operator, this.factor];
  }

  public toString(): string {
    return `${this.operator.lexeme} ${this.factor.toString()}`;
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitUnary(this);
  }
}

export class FactorExpr extends Expr {
  constructor(
    public readonly suffix: IExpr,
    public readonly power: IToken,
    public readonly exponent: IExpr) {
    super();
  }

  public get start(): Position {
    return this.suffix.start;
  }

  public get end(): Position {
    return this.exponent.end;
  }

  public get ranges(): Range[] {
    return [this.suffix, this.power, this.exponent];
  }

  public toString(): string {
    return `${this.suffix.toString()} ${this.power.toString()} ${this.exponent.toString()}`;
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitFactor(this);
  }
}

export class SuffixExpr extends Expr {
  constructor(
    public readonly suffix: IExpr,
    public readonly colon: IToken,
    public readonly trailer: IExpr) {
    super();
  }

  public get start(): Position {
    return this.suffix.start;
  }

  public get end(): Position {
    return this.trailer.end;
  }

  public get ranges(): Range[] {
    return [this.suffix, this.colon, this.trailer];
  }

  public toString(): string {
    return `${this.suffix.toString()}${this.colon.lexeme}${this.trailer.toString()}`;
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitSuffix(this);
  }
}

export class CallExpr extends Expr {
  constructor(
    public readonly callee: IExpr,
    public readonly open: IToken,
    public readonly args: IExpr[],
    public readonly close: IToken) {
    super();
  }

  public get start(): Position {
    return this.callee.start;
  }

  public get end(): Position {
    return this.close.end;
  }

  public get ranges(): Range[] {
    return [this.callee, this.open, ...this.args, this.close];
  }

  public toString(): string {
    return `${this.callee.toString()}${this.open.lexeme}`
     + `${this.args.map(a => a.toString()).join(', ')}${this.close.lexeme}`;
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitCall(this);
  }
}

export class ArrayIndexExpr extends Expr {
  constructor(
    public readonly array: IExpr,
    public readonly indexer: IToken,
    public readonly index: IToken) {
    super();
  }

  public get start(): Position {
    return this.array.start;
  }

  public get end(): Position {
    return this.index.end;
  }

  public get ranges(): Range[] {
    return [this.array, this.indexer, this.index];
  }

  public toString(): string {
    return `${this.array.toString()}${this.indexer.lexeme}${this.index.lexeme}`;
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitArrayIndex(this);
  }
}

export class ArrayBracketExpr extends Expr {
  constructor(
    public readonly array: IExpr,
    public readonly open: IToken,
    public readonly index: IExpr,
    public readonly close: IToken) {
    super();
  }

  public get start(): Position {
    return this.array.start;
  }

  public get end(): Position {
    return this.close.end;
  }

  public get ranges(): Range[] {
    return [this.array, this.open, this.index, this.close];
  }

  public toString(): string {
    return `${this.array.toString()}${this.open.lexeme}`
      + `${this.index.toString()}${this.close.lexeme}`;
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitArrayBracket(this);
  }
}

export class DelegateExpr extends Expr {
  constructor (
    public readonly variable: IExpr,
    public readonly atSign: IToken) {
    super();
  }

  public get start(): Position {
    return this.variable.start;
  }

  public get end(): Position {
    return this.atSign.end;
  }

  public get ranges(): Range[] {
    return [this.variable, this.atSign];
  }

  public toString(): string {
    return `${this.variable.toString()}${this.atSign.lexeme}`;
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitDelegate(this);
  }
}

export class LiteralExpr extends Expr {
  constructor(public readonly token: IToken) {
    super();
  }

  public get start(): Position {
    return this.token.start;
  }

  public get end(): Position {
    return this.token.end;
  }

  public get ranges(): Range[] {
    return [this.token];
  }

  public toString(): string {
    return `${this.token.lexeme}`;
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitLiteral(this);
  }
}

export class VariableExpr extends Expr {
  constructor(
    public readonly token: IToken) {
    super();
  }

  public get start(): Position {
    return this.token.start;
  }

  public get end(): Position {
    return this.token.end;
  }

  public get ranges(): Range[] {
    return [this.token];
  }

  public get isKeyword(): boolean {
    return !(this.token.type === TokenType.identifier
      || this.token.type === TokenType.fileIdentifier);
  }

  public toString(): string {
    return `${this.token.lexeme}`;
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitVariable(this);
  }
}

export class GroupingExpr extends Expr {
  constructor(
    public readonly open: IToken,
    public readonly expr: IExpr,
    public readonly close: IToken) {
    super();
  }

  public get start(): Position {
    return this.open.start;
  }

  public get end(): Position {
    return this.close.end;
  }

  public get ranges(): Range[] {
    return [this.open, this.expr, this.close];
  }

  public toString(): string {
    return `${this.open.lexeme}${this.expr.toString()}${this.close.lexeme}`;
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitGrouping(this);
  }
}

export class AnonymousFunctionExpr extends Expr {
  constructor(
    public readonly open: IToken,
    public readonly instruction: IInst[],
    public readonly close: IToken) {
    super();
  }

  public get start(): Position {
    return this.open.start;
  }

  public get end(): Position {
    return this.close.end;
  }

  public get ranges(): Range[] {
    return [this.open, ...this.instruction, this.close];
  }

  public toString(): string {
    return `{${this.instruction.map(i => i.toString()).join(' ')}}`;
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitAnonymousFunction(this);
  }
}
