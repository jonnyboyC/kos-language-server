import {
  IExprClass,
  IExprVisitor,
  IExpr,
  IExprClassVisitor,
  GrammarNode,
  Distribution,
  IExprPasser,
  SyntaxKind,
  NodeDataBuilder,
  PartialNode,
} from './types';
import * as SuffixTerm from './suffixTerm';
import * as Stmt from './stmt';
import { TokenType } from '../entities/tokentypes';
import { Range, Position } from 'vscode-languageserver';
import {
  createGrammarUnion,
  createGrammarOptional,
  createGrammarRepeat,
  createConstant,
  createExponential,
} from './grammarNodes';
import { empty, unWrap, notEmpty } from '../utilities/typeGuards';
import { NodeBase } from './base';
import { joinLines } from './toStringUtils';
import { Token } from '../entities/token';
import { SymbolTracker } from '../analysis/types';
import { rangeOrder, rangeContains } from '../utilities/positionUtils';

/**
 * Expression base class
 */
export abstract class Expr extends NodeBase implements IExpr {
  /**
   * Return the tree node type of expression
   */
  get tag(): SyntaxKind.expr {
    return SyntaxKind.expr;
  }

  /**
   * All expressions implement the pass method
   * Called when the node should be passed through
   * @param visitor visitor object
   */
  public abstract pass<T>(visitor: IExprPasser<T>): T;

  /**
   * All expressions implement the accept method
   * Called when the node should execute the visitors methods
   * @param visitor visitor object
   */
  public abstract accept<T>(visitor: IExprVisitor<T>): T;
}

/**
 * Container for tokens constituting an invalid expression
 */
export class Invalid extends Expr {
  /**
   * Invalid expression constructor
   * @param pos start position of the invalid expression
   * @param tokens all tokens in the invalid range
   * @param partial the partial if any found in the invalid range
   */
  constructor(
    public readonly pos: Position,
    public readonly tokens: Token[],
    public readonly partial?: PartialNode,
  ) {
    super();
  }

  public get start(): Position {
    return this.tokens.length > 0 ? this.tokens[0].start : this.pos;
  }

  public get end(): Position {
    return this.tokens.length > 0
      ? this.tokens[this.tokens.length - 1].end
      : this.pos;
  }

  public get ranges(): Range[] {
    if (empty(this.partial)) {
      return this.tokens;
    }

    // order each piece of the partial by it's range
    let segments = Object.values(this.partial)
      .filter(notEmpty)
      .sort(rangeOrder);

    // attempt to add tokens to segments
    for (const token of this.tokens) {
      let overlap = false;

      // check for overlap
      for (const segment of segments) {
        if (rangeContains(segment, token)) {
          overlap = true;
          break;
        }
      }

      // if no overall add to segments
      if (!overlap) {
        segments.push(token);
      }
    }

    // reorder segments
    segments = segments.sort(rangeOrder);
    return segments;
  }

  public toLines(): string[] {
    return [this.tokens.map(t => t.lexeme).join(' ')];
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitExprInvalid(this);
  }

  public pass<T>(visitor: IExprPasser<T>): T {
    return visitor.passExprInvalid(this);
  }

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitExprInvalid(this);
  }
}

/**
 * Class holding all valid ternary expressions in KOS
 */
export class Ternary extends Expr {
  /**
   * Grammar for the ternary expression
   */
  public static grammar: GrammarNode[];

  /**
   * The choose token
   */
  public readonly choose: Token;

  /**
   * the true expression
   */
  public readonly trueExpr: IExpr;

  /**
   * The if token
   */
  public readonly ifToken: Token;

  /**
   * ternary condition expression
   */
  public readonly condition: IExpr;

  /**
   * The else token
   */
  public readonly elseToken: Token;

  /**
   * the false expression
   */
  public readonly falseExpr: IExpr;

  /**
   * Constructor for all ternary expressions
   * @param builder the ternary builder
   */
  constructor(builder: NodeDataBuilder<Ternary>) {
    super();
    this.choose = unWrap(builder.choose);
    this.trueExpr = unWrap(builder.trueExpr);
    this.ifToken = unWrap(builder.ifToken);
    this.condition = unWrap(builder.condition);
    this.elseToken = unWrap(builder.elseToken);
    this.falseExpr = unWrap(builder.falseExpr);
  }

  public get start(): Position {
    return this.choose.start;
  }

  public get end(): Position {
    return this.falseExpr.end;
  }

  public get ranges(): Range[] {
    return [
      this.choose,
      this.trueExpr,
      this.ifToken,
      this.condition,
      this.elseToken,
      this.falseExpr,
    ];
  }

  public toLines(): string[] {
    const trueLines = this.trueExpr.toLines();
    const conditionLines = this.condition.toLines();
    const falseLines = this.falseExpr.toLines();

    trueLines[0] = `${this.choose.lexeme} ${trueLines[0]}`;

    const lines = joinLines(
      ` ${this.ifToken.lexeme} `,
      trueLines,
      conditionLines,
    );
    return joinLines(` ${this.elseToken.lexeme} `, lines, falseLines);
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitTernary(this);
  }

  public pass<T>(visitor: IExprPasser<T>): T {
    return visitor.passTernary(this);
  }

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitTernary(this);
  }
}

/**
 * Class holding all valid binary expressions in KOS
 */
export class Binary extends Expr {
  /**
   * Grammar for the binary expression
   */
  public static grammar: GrammarNode[];

  /**
   * left expression of the operator
   */
  public readonly left: IExpr;

  /**
   * The operator
   */
  public readonly operator: Token;

  /**
   * right expression of the operator
   */
  public readonly right: IExpr;

  /**
   * Constructor for all binary expressions
   * @param builder the binary expression builder
   */
  constructor(builder: NodeDataBuilder<Binary>) {
    super();
    this.left = unWrap(builder.left);
    this.operator = unWrap(builder.operator);
    this.right = unWrap(builder.right);
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

  public toLines(): string[] {
    const leftLines = this.left.toLines();
    const rightLines = this.right.toLines();

    return joinLines(` ${this.operator.lexeme} `, leftLines, rightLines);
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitBinary(this);
  }

  public pass<T>(visitor: IExprPasser<T>): T {
    return visitor.passBinary(this);
  }

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitBinary(this);
  }
}

/**
 * Class holding all valid unary expressions in KOS
 */
export class Unary extends Expr {
  /**
   * Grammar for the unary expressions
   */
  public static grammar: GrammarNode[];

  /**
   * Unary expression constructor
   * @param operator unary operator
   * @param factor factor
   */
  constructor(public readonly operator: Token, public readonly factor: IExpr) {
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

  public toLines(): string[] {
    const lines = this.factor.toLines();

    switch (this.operator.type) {
      case TokenType.plus:
      case TokenType.minus:
        lines[0] = `${this.operator.lexeme}${lines[0]}`;
        return lines;
      default:
        lines[0] = `${this.operator.lexeme} ${lines[0]}`;
        return lines;
    }
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitUnary(this);
  }

  public pass<T>(visitor: IExprPasser<T>): T {
    return visitor.passUnary(this);
  }

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitUnary(this);
  }
}

/**
 * Class holding expression with exponents
 */
export class Factor extends Expr {
  /**
   * Grammer for factor expressions
   */
  public static grammar: GrammarNode[];

  /**
   * Factor constructor
   * @param suffix base expression
   * @param power exponent token
   * @param exponent exponent expression
   */
  constructor(
    public readonly suffix: IExpr,
    public readonly power: Token,
    public readonly exponent: IExpr,
  ) {
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

  public toLines(): string[] {
    return joinLines(
      this.power.lexeme,
      this.suffix.toLines(),
      this.exponent.toLines(),
    );
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitFactor(this);
  }

  public pass<T>(visitor: IExprPasser<T>): T {
    return visitor.passFactor(this);
  }

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitFactor(this);
  }
}

/**
 * Class holding all anonymous functions
 */
export class Lambda extends Expr {
  /**
   * Grammar for anonymous functions
   */
  public static grammar: GrammarNode[];

  /**
   * Anonymous Function constructor
   * @param block the scope for the lambda
   */
  constructor(public readonly block: Stmt.Block) {
    super();
  }

  public get start(): Position {
    return this.block.start;
  }

  public get end(): Position {
    return this.block.end;
  }

  public get ranges(): Range[] {
    return this.block.ranges;
  }

  public toLines(): string[] {
    return this.block.toLines();
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitLambda(this);
  }

  public pass<T>(visitor: IExprPasser<T>): T {
    return visitor.passAnonymousFunction(this);
  }

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitAnonymousFunction(this);
  }
}

/**
 * Class holding all kos suffixes
 */
export class Suffix extends Expr {
  /**
   * Grammar for suffixes
   */
  public static grammar: GrammarNode[];

  /**
   * Suffix constructor
   * @param suffixTerm base suffix term
   * @param colon optional suffix color
   * @param trailer optional suffix trailer
   */
  constructor(
    public readonly suffixTerm: SuffixTerm.SuffixTerm,
    public colon?: Token,
    public trailer?: SuffixTerm.SuffixTrailer,
  ) {
    super();
  }

  public get start(): Position {
    return this.suffixTerm.start;
  }

  public get end(): Position {
    return empty(this.trailer) ? this.suffixTerm.end : this.trailer.end;
  }

  public get ranges(): Range[] {
    if (!empty(this.colon) && !empty(this.trailer)) {
      return [this.suffixTerm, this.colon, this.trailer];
    }

    return [this.suffixTerm];
  }

  /**
   * Get the most resolved type on this suffix
   */
  public mostResolveTracker(): Maybe<SymbolTracker> {
    // if no trailer check suffix term
    if (empty(this.trailer)) {
      const { atom, trailers } = this.suffixTerm;

      // check for suffix term trailers
      if (trailers.length > 0) {
        const lastTrailer = trailers[trailers.length - 1];

        if (lastTrailer instanceof SuffixTerm.ArrayBracket) {
          return lastTrailer.open.tracker;
        }

        if (lastTrailer instanceof SuffixTerm.ArrayIndex) {
          return undefined;
        }

        if (lastTrailer instanceof SuffixTerm.Call) {
          return lastTrailer.open.tracker;
        }

        return undefined;
      }

      // check nested trailers
      if (atom instanceof SuffixTerm.Identifier) {
        return atom.token.tracker;
      }

      return undefined;
    }

    // check nested trailers
    if (!empty(this.trailer)) {
      return this.trailer.mostResolveTracker();
    }

    return undefined;
  }

  public toLines(): string[] {
    const suffixTermLines = this.suffixTerm.toLines();

    if (!empty(this.colon) && !empty(this.trailer)) {
      const trailerLines = this.trailer.toLines();
      return joinLines(this.colon.lexeme, suffixTermLines, trailerLines);
    }

    return suffixTermLines;
  }

  public accept<T>(visitor: IExprVisitor<T>): T {
    return visitor.visitSuffix(this);
  }

  public pass<T>(visitor: IExprPasser<T>): T {
    return visitor.passSuffix(this);
  }

  public static classAccept<T>(visitor: IExprClassVisitor<T>): T {
    return visitor.visitSuffix(this);
  }
}

/**
 * All valid expressions
 */
export const validExpressions: Constructor<Expr>[] = [
  Ternary,
  Binary,
  Unary,
  Factor,
  Suffix,
  Lambda,
];

export const validExprTypes: [IExprClass, Distribution][] = [
  [Ternary, createConstant(0.2)],
  [Binary, createConstant(1.0)],
  [Unary, createConstant(0.5)],
  [Factor, createConstant(0.5)],
  [Suffix, createConstant(3)],
  // TODO update when insts included
  [Lambda, createConstant(0)],
];

export const expr = createGrammarUnion(...validExprTypes);

Ternary.grammar = [
  TokenType.choose,
  expr,
  TokenType.if,
  expr,
  TokenType.else,
  expr,
];

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
  createGrammarUnion([Factor, createConstant(1)], [Suffix, createConstant(3)]),
];

Factor.grammar = [
  Suffix,
  createGrammarOptional(createExponential(2), TokenType.power, Suffix),
];

Suffix.grammar = [
  SuffixTerm.SuffixTerm,
  createGrammarRepeat(
    createExponential(2),
    TokenType.colon,
    SuffixTerm.SuffixTerm,
  ),
];

Lambda.grammar = [
  TokenType.curlyOpen,
  //
  TokenType.curlyClose,
];
