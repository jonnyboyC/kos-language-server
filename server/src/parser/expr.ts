import {
  IExprClass, IInst, IExprVisitor,
  ISuffixTerm, IExpr, IExprClassVisitor,
  GrammarNode, Distribution,
} from './types';
import * as SuffixTerm from './suffixTerm';
import { TokenType } from '../entities/tokentypes';
import { IToken } from '../entities/types';
import { Range, Position } from 'vscode-languageserver';
import {
  createGrammarUnion, createGrammarOptional,
  createGrammarRepeat, createConstant,
  createExponential,
} from './grammarNodes';
import { empty } from '../utilities/typeGuards';
import { NodeBase } from './base';

export abstract class Expr extends NodeBase implements IExpr {
  get tag(): 'expr' {
    return 'expr';
  }

  public abstract accept<T>(visitor: IExprVisitor<T>): T;
}

export class Invalid extends Expr {
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

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitExprInvalid(this);
  }
}

export class Binary extends Expr {
  public static grammar: GrammarNode[];

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

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitBinary(this);
  }
}

export class Unary extends Expr {
  public static grammar: GrammarNode[];

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

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitUnary(this);
  }
}

export class Factor extends Expr {
  public static grammar: GrammarNode[];

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

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitFactor(this);
  }
}

export class AnonymousFunction extends Expr {
  public static grammar: GrammarNode[];

  constructor(
    public readonly open: IToken,
    public readonly insts: IInst[],
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
    return [this.open, ...this.insts, this.close];
  }

  public toString(): string {
    return `{${this.insts.map(i => i.toString()).join(' ')}}`;
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitAnonymousFunction(this);
  }

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitAnonymousFunction(this);
  }
}

export class Suffix extends Expr {
  public static grammar: GrammarNode[];

  constructor(
    public readonly suffixTerm: SuffixTerm.SuffixTerm,
    public colon?: IToken,
    public trailer?: ISuffixTerm) {
    super();
  }

  public get start(): Position {
    return this.suffixTerm.start;
  }

  public get end(): Position {
    return empty(this.trailer)
      ? this.suffixTerm.end
      : this.trailer.end;
  }

  public get ranges(): Range[] {
    if (!empty(this.colon) && !empty(this.trailer)) {
      return [this.suffixTerm, this.colon, this.trailer];
    }

    return [this.suffixTerm];
  }

  public endsInCall(): boolean {
    // if no trailer check suffix term
    if (empty(this.trailer)) {
      const suffixTermTrailers = this.suffixTerm.trailers;

      // check for suffix term trailers
      if (suffixTermTrailers.length > 0) {
        const lastTrailer = suffixTermTrailers[suffixTermTrailers.length - 1];
        if (lastTrailer instanceof SuffixTerm.Call) {
          return true;
        }
      }

      return false;
    }

    // check nested trailers
    if (this.trailer instanceof Suffix) {
      return this.trailer.endsInCall();
    }

    return false;
  }

  public toString(): string {
    if (!empty(this.colon) && !empty(this.trailer)) {
      return `${this.suffixTerm.toString()}${this.colon.lexeme}${this.trailer.toString()}`;
    }

    return this.suffixTerm.toString();
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitSuffix(this);
  }

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitSuffix(this);
  }
}

export const validExprTypes: [IExprClass, Distribution][] = [
  [Binary, createConstant(1.0)],
  [Unary, createConstant(0.5)],
  [Factor, createConstant(0.5)],
  [Suffix, createConstant(3)],
  [AnonymousFunction, createConstant(0)],
];

export const expr = createGrammarUnion(...validExprTypes);

Binary.grammar = [
  expr,
  createGrammarUnion(
    [TokenType.plus, createConstant(1)],
    [TokenType.minus, createConstant(1)],
    [TokenType.multi, createConstant(1)],
    [TokenType.div, createConstant(1)],
    [TokenType.equal, createConstant(1)],
    [TokenType.notEqual, createConstant(1)],
    [TokenType.less, createConstant(1)],
    [TokenType.lessEqual, createConstant(1)],
    [TokenType.greater, createConstant(1)],
    [TokenType.greaterEqual, createConstant(1)],
    [TokenType.or, createConstant(1)],
    [TokenType.and, createConstant(1)],
  ),
  expr,
];

Unary.grammar = [
  createGrammarOptional(
    createConstant(0.2),
    createGrammarUnion(
      [TokenType.plus, createConstant(1)],
      [TokenType.minus, createConstant(1)],
      [TokenType.not, createConstant(1)],
      [TokenType.defined, createConstant(1)],
    ),
  ),
  Factor,
];

Factor.grammar = [
  Suffix,
  createGrammarOptional(
    createExponential(2),
    TokenType.power,
    Suffix,
  ),
];

Suffix.grammar = [
  SuffixTerm.SuffixTerm,
  createGrammarRepeat(
    createExponential(2),
    TokenType.colon,
    SuffixTerm.SuffixTerm,
  ),
];

AnonymousFunction.grammar = [
  TokenType.curlyOpen,
  //
  TokenType.curlyClose,
];
