import {
  IExprClass, IInst, IExprVisitor,
  ISuffix, IExpr, IExprClassVisitor, GrammarNode, Distribution,
} from './types';
import { TokenType } from '../entities/tokentypes';
import { IToken } from '../entities/types';
import { Range, Position } from 'vscode-languageserver';
import {
  createGrammarUnion, createGrammarOptional,
  createGrammarRepeat, createConstant,
  createExponential, createNormal, createGamma,
} from './grammarNodes';

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

export abstract class SuffixBase extends Expr implements ISuffix {
  get isSuffix(): true {
    return true;
  }
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

export class Suffix extends SuffixBase {
  public static grammar: GrammarNode[];

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

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitSuffix(this);
  }
}

export class Call extends SuffixBase {
  public static grammar: GrammarNode[];

  constructor(
    public readonly callee: IExpr,
    public readonly open: IToken,
    public readonly args: IExpr[],
    public readonly close: IToken,
    public readonly isTrailer: boolean) {
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

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitCall(this);
  }
}

export class ArrayIndex extends SuffixBase {
  public static grammar: GrammarNode[];

  constructor(
    public readonly array: IExpr,
    public readonly indexer: IToken,
    public readonly index: IToken,
    public readonly isTrailer: boolean) {
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

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitArrayIndex(this);
  }
}

export class ArrayBracket extends SuffixBase {
  public static grammar: GrammarNode[];

  constructor(
    public readonly array: IExpr,
    public readonly open: IToken,
    public readonly index: IExpr,
    public readonly close: IToken,
    public readonly isTrailer: boolean) {
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

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitArrayBracket(this);
  }
}

export class Delegate extends SuffixBase {
  public static grammar: GrammarNode[];

  constructor (
    public readonly variable: IExpr,
    public readonly atSign: IToken,
    public readonly isTrailer: boolean) {
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

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitDelegate(this);
  }
}

export class Literal extends SuffixBase {
  public static grammar: GrammarNode[];

  constructor(
    public readonly token: IToken,
    public readonly isTrailer: boolean) {
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

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitLiteral(this);
  }
}

export class Variable extends SuffixBase {
  public static grammar: GrammarNode[];

  constructor(
    public readonly token: IToken,
    public readonly isTrailer: boolean) {
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

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitVariable(this);
  }
}

export class Grouping extends SuffixBase {
  public static grammar: GrammarNode[];

  constructor(
    public readonly open: IToken,
    public readonly expr: IExpr,
    public readonly close: IToken,
    public readonly isTrailer: boolean) {
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

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitGrouping(this);
  }
}

// TODO this returns a delegate
export class AnonymousFunction extends Expr {
  public static grammar: GrammarNode[];

  constructor(
    public readonly open: IToken,
    public readonly instructions: IInst[],
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
    return [this.open, ...this.instructions, this.close];
  }

  public toString(): string {
    return `{${this.instructions.map(i => i.toString()).join(' ')}}`;
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitAnonymousFunction(this);
  }

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitAnonymousFunction(this);
  }
}

export const validExprTypes: [IExprClass, Distribution][] = [
  [Binary, createConstant(1)],
  [Unary, createConstant(1)],
  [Factor, createConstant(1)],
  [Suffix, createConstant(1)],
  [Call, createConstant(1)],
  [ArrayIndex, createConstant(1)],
  [ArrayBracket, createConstant(1)],
  [Delegate, createConstant(1)],
  [Literal, createConstant(1)],
  [Variable, createConstant(1)],
  [Grouping, createConstant(1)],
  [AnonymousFunction, createConstant(0)],
];

const expr = createGrammarUnion(...validExprTypes);

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

const suffixTerm = createGrammarUnion(
  [Literal, createNormal(1.3, 1)],
  [Variable, createNormal(3, 1)],
  [Grouping, createNormal(0.4, 0.2)],
  [Call, createNormal(0.5, 0.5)],
  [ArrayIndex, createNormal(0.5, 0.5)],
  [ArrayBracket, createNormal(0.1, 0.1)],
);

Suffix.grammar = [
  suffixTerm,
  createGrammarRepeat(
    createExponential(2),
    TokenType.colon,
    suffixTerm,
  ),
];

Call.grammar = [
  suffixTerm,
  TokenType.bracketOpen,
  createGrammarOptional(
    createExponential(3),
    createGrammarUnion(...validExprTypes),
    createGrammarRepeat(
      createGamma(1.5, 0.4),
      TokenType.comma,
      createGrammarUnion(...validExprTypes),
    ),
  ),
  TokenType.bracketClose,
];

ArrayIndex.grammar = [
  suffixTerm,
  TokenType.arrayIndex,
  createGrammarUnion(
    [TokenType.integer, createNormal(3, 1)],
    [TokenType.identifier, createNormal(1, 1)],
  ),
];

ArrayBracket.grammar = [
  suffixTerm,
  TokenType.bracketOpen,
  expr,
  TokenType.bracketClose,
];

Delegate.grammar = [
  suffixTerm,
  TokenType.atSign,
];

Literal.grammar = [
  createGrammarUnion(
    [TokenType.integer, createConstant(1)],
    [TokenType.double, createConstant(1.5)],
    [TokenType.true, createConstant(0.5)],
    [TokenType.false, createConstant(0.5)],
    [TokenType.fileIdentifier, createConstant(0.1)],
    [TokenType.string, createConstant(2)],
  ),
];

Variable.grammar = [
  TokenType.identifier,
];

Grouping.grammar = [
  TokenType.bracketOpen,
  expr,
  TokenType.bracketClose,
];

AnonymousFunction.grammar = [
  TokenType.curlyOpen,
  //
  TokenType.curlyClose,
];
