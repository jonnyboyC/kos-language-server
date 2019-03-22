import {
  ISuffixTerm, ISuffixTermVisitor, GrammarNode,
  IExpr, Atom, SuffixTermTrailer, ISuffixTermClassVisitor,
  Distribution, ISuffixTermClass, ISuffixTermParamVisitor,
  ISuffixTermPasser,
  SyntaxKind,
} from './types';
import { Range, Position } from 'vscode-languageserver';
import { IToken } from '../entities/types';
import { TokenType } from '../entities/tokentypes';
import {
  createGrammarOptional, createGrammarUnion,
  createExponential, createGrammarRepeat,
  createGamma, createConstant, createNormal,
} from './grammarNodes';
import { expr } from './expr';
import { NodeBase } from './base';
import { empty } from '../utilities/typeGuards';

export abstract class SuffixTermBase extends NodeBase implements ISuffixTerm {
  get tag(): SyntaxKind.suffixTerm {
    return SyntaxKind.suffixTerm;
  }

  public abstract accept<T>(visitor: ISuffixTermVisitor<T>): T;
  public abstract pass<T>(visitor: ISuffixTermPasser<T>): T;
  public abstract acceptParam<TP, TR>(
    visitor: ISuffixTermParamVisitor<TP, TR>,
    param: TP): TR;
}

export class Invalid extends SuffixTermBase {
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

  public acceptParam<TP, TR>(visitor: ISuffixTermParamVisitor<TP, TR>, param: TP): TR {
    return visitor.visitSuffixTermInvalid(this, param);
  }

  public pass<T>(visitor: ISuffixTermPasser<T>): T {
    return visitor.passSuffixTermInvalid(this);
  }

  public accept<T>(visitor: ISuffixTermVisitor<T>): T {
    return visitor.visitSuffixTermInvalid(this);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitSuffixTermInvalid(this);
  }
}

export class SuffixTrailer extends SuffixTermBase {
  public static grammar: GrammarNode[];

  constructor(
    public readonly suffixTerm: SuffixTerm,
    public colon?: IToken,
    public trailer?: SuffixTrailer) {
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
        if (lastTrailer instanceof Call) {
          return true;
        }
      }

      return false;
    }

    // check nested trailers
    if (this.trailer instanceof SuffixTrailer) {
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
  public acceptParam<TP, TR>(visitor: ISuffixTermParamVisitor<TP, TR>, param: TP): TR {
    return visitor.visitSuffixTrailer(this, param);
  }

  public accept<T>(visitor: ISuffixTermVisitor<T>): T {
    return visitor.visitSuffixTrailer(this);
  }

  public pass<T>(visitor: ISuffixTermPasser<T>): T {
    return visitor.passSuffixTrailer(this);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitSuffixTrailer(this);
  }}

export class SuffixTerm extends SuffixTermBase {
  public static grammar: GrammarNode[];

  constructor(
    public readonly atom: Atom,
    public readonly trailers: SuffixTermTrailer[]) {
    super();
  }
  public get ranges(): Range[] {
    return [this.atom as Range, ...this.trailers as Range[]];
  }
  public get start(): Position {
    return this.atom.start;
  }
  public get end(): Position {
    if (this.trailers.length > 0) {
      return this.trailers[this.trailers.length - 1].end;
    }

    return this.atom.end;
  }
  public toString(): string {
    return `${this.atom.toString()}${this.trailers.map(trailer => trailer.toString()).join('')}`;
  }

  public acceptParam<TP, TR>(visitor: ISuffixTermParamVisitor<TP, TR>, param: TP): TR {
    return visitor.visitSuffixTerm(this, param);
  }

  public accept<T>(visitor: ISuffixTermVisitor<T>): T {
    return visitor.visitSuffixTerm(this);
  }

  public pass<T>(visitor: ISuffixTermPasser<T>): T {
    return visitor.passSuffixTerm(this);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitSuffixTerm(this);
  }
}

export class Call extends SuffixTermBase {
  public static grammar: GrammarNode[];

  constructor(
    public readonly open: IToken,
    public readonly args: IExpr[],
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
    return [this.open, ...this.args, this.close];
  }

  public toString(): string {
    return `${this.open.lexeme}`
     + `${this.args.map(a => a.toString()).join(', ')}${this.close.lexeme}`;
  }

  public acceptParam<TP, TR>(visitor: ISuffixTermParamVisitor<TP, TR>, param: TP): TR {
    return visitor.visitCall(this, param);
  }

  public accept<T>(visitor: ISuffixTermVisitor<T>): T {
    return visitor.visitCall(this);
  }

  public pass<T>(visitor: ISuffixTermPasser<T>): T {
    return visitor.passCall(this);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitCall(this);
  }
}

export class ArrayIndex extends SuffixTermBase {
  public static grammar: GrammarNode[];

  constructor(
    public readonly indexer: IToken,
    public readonly index: IToken,
    public readonly isTrailer: boolean) {
    super();
  }

  public get start(): Position {
    return this.indexer.start;
  }

  public get end(): Position {
    return this.index.end;
  }

  public get ranges(): Range[] {
    return [this.indexer, this.index];
  }

  public toString(): string {
    return `${this.indexer.lexeme}${this.index.lexeme}`;
  }

  public acceptParam<TP, TR>(visitor: ISuffixTermParamVisitor<TP, TR>, param: TP): TR {
    return visitor.visitArrayIndex(this, param);
  }

  public accept<T>(visitor: ISuffixTermVisitor<T>): T {
    return visitor.visitArrayIndex(this);
  }

  public pass<T>(visitor: ISuffixTermPasser<T>): T {
    return visitor.passArrayIndex(this);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitArrayIndex(this);
  }
}

export class ArrayBracket extends SuffixTermBase {
  public static grammar: GrammarNode[];

  constructor(
    public readonly open: IToken,
    public readonly index: IExpr,
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
    return [this.open, this.index, this.close];
  }

  public toString(): string {
    return `${this.open.lexeme}`
      + `${this.index.toString()}${this.close.lexeme}`;
  }

  public acceptParam<TP, TR>(visitor: ISuffixTermParamVisitor<TP, TR>, param: TP): TR {
    return visitor.visitArrayBracket(this, param);
  }

  public accept<T>(visitor: ISuffixTermVisitor<T>): T {
    return visitor.visitArrayBracket(this);
  }

  public pass<T>(visitor: ISuffixTermPasser<T>): T {
    return visitor.passArrayBracket(this);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitArrayBracket(this);
  }
}

export class Delegate extends SuffixTermBase {
  public static grammar: GrammarNode[];

  constructor (
    public readonly atSign: IToken,
    public readonly isTrailer: boolean) {
    super();
  }

  public get start(): Position {
    return this.atSign.start;
  }

  public get end(): Position {
    return this.atSign.end;
  }

  public get ranges(): Range[] {
    return [this.atSign];
  }

  public toString(): string {
    return this.atSign.lexeme;
  }

  public acceptParam<TP, TR>(visitor: ISuffixTermParamVisitor<TP, TR>, param: TP): TR {
    return visitor.visitDelegate(this, param);
  }

  public accept<T>(visitor: ISuffixTermVisitor<T>): T {
    return visitor.visitDelegate(this);
  }

  public pass<T>(visitor: ISuffixTermPasser<T>): T {
    return visitor.passDelegate(this);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitDelegate(this);
  }
}

export class Literal extends SuffixTermBase {
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

  public acceptParam<TP, TR>(visitor: ISuffixTermParamVisitor<TP, TR>, param: TP): TR {
    return visitor.visitLiteral(this, param);
  }

  public accept<T>(visitor: ISuffixTermVisitor<T>): T {
    return visitor.visitLiteral(this);
  }

  public pass<T>(visitor: ISuffixTermPasser<T>): T {
    return visitor.passLiteral(this);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitLiteral(this);
  }
}

export class Identifier extends SuffixTermBase {
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

  public acceptParam<TP, TR>(visitor: ISuffixTermParamVisitor<TP, TR>, param: TP): TR {
    return visitor.visitIdentifier(this, param);
  }

  public accept<T>(visitor: ISuffixTermVisitor<T>): T {
    return visitor.visitIdentifier(this);
  }

  public pass<T>(visitor: ISuffixTermPasser<T>): T {
    return visitor.passIdentifier(this);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitVariable(this);
  }
}

export class Grouping extends SuffixTermBase {
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

  public acceptParam<TP, TR>(visitor: ISuffixTermParamVisitor<TP, TR>, param: TP): TR {
    return visitor.visitGrouping(this, param);
  }

  public accept<T>(visitor: ISuffixTermVisitor<T>): T {
    return visitor.visitGrouping(this);
  }

  public pass<T>(visitor: ISuffixTermPasser<T>): T {
    return visitor.passGrouping(this);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitGrouping(this);
  }
}

const atomTypes: [ISuffixTermClass, Distribution][] = [
  [Literal, createConstant(0.8)],
  [Identifier, createConstant(1)],
  [Grouping, createConstant(0.3)],
];

const suffixTermTrailers: [ISuffixTermClass, Distribution][] = [
  [Call, createConstant(0.8)],
  [ArrayBracket, createConstant(1)],
  [ArrayIndex, createConstant(0.3)],
];

const atom = createGrammarUnion(...atomTypes);
const suffixTermTrailer = createGrammarUnion(...suffixTermTrailers);

SuffixTerm.grammar = [
  atom,
  createGrammarRepeat(
    createExponential(1.5),
    suffixTermTrailer,
  ),
];

Call.grammar = [
  TokenType.bracketOpen,
  createGrammarOptional(
    createExponential(3),
    expr,
    createGrammarRepeat(
      createGamma(1.5, 0.4),
      TokenType.comma,
      expr,
    ),
  ),
  TokenType.bracketClose,
];

ArrayIndex.grammar = [
  TokenType.arrayIndex,
  createGrammarUnion(
    [TokenType.integer, createNormal(3, 1)],
    [TokenType.identifier, createNormal(1, 1)],
  ),
];

ArrayBracket.grammar = [
  TokenType.bracketOpen,
  expr,
  TokenType.bracketClose,
];

Delegate.grammar = [
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

Identifier.grammar = [
  TokenType.identifier,
];

Grouping.grammar = [
  TokenType.bracketOpen,
  expr,
  TokenType.bracketClose,
];
