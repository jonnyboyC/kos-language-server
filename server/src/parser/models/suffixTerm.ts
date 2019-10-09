import {
  ISuffixTerm,
  ISuffixTermVisitor,
  GrammarNode,
  IExpr,
  Atom,
  SuffixTermTrailer,
  ISuffixTermClassVisitor,
  Distribution,
  ISuffixTermClass,
  SyntaxKind,
} from '../types';
import { Range, Position } from 'vscode-languageserver';
import { TokenType } from '../../models/tokentypes';
import {
  createGrammarOptional,
  createGrammarUnion,
  createExponential,
  createGrammarRepeat,
  createGamma,
  createConstant,
  createNormal,
} from '../utils/grammarNodes';
import { expr } from './expr';
import { NodeBase } from './base';
import { empty } from '../../utilities/typeGuards';
import { joinLines } from '../utils/toStringUtils';
import { Token } from '../../models/token';
import { SymbolTracker } from '../../analysis/types';

/**
 * Base class for all suffix terms
 */
export abstract class SuffixTermBase extends NodeBase implements ISuffixTerm {
  /**
   * Tag used to denote syntax node of the instance
   */
  get tag(): SyntaxKind.suffixTerm {
    return SyntaxKind.suffixTerm;
  }

  /**
   * Require all subclasses to implement the accept method
   * Called when the node should execute the visitors methods
   * @param visitor visitor object
   */
  public abstract accept<T extends (...args: any) => any>(
    visitor: ISuffixTermVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T>;
}

/**
 * Container for tokens constituting an invalid suffix term
 */
export class Invalid extends SuffixTermBase {
  /**
   * Invalid suffix term constructor
   * @param tokens tokens in the invalid range
   */
  constructor(public readonly position: Position) {
    super();
  }

  public get start(): Position {
    return this.position;
  }

  public get end(): Position {
    return this.position;
  }

  public get ranges(): Range[] {
    return [];
  }

  public toLines(): string[] {
    return [''];
  }

  public accept<T extends (...args: any) => any>(
    visitor: ISuffixTermVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitSuffixTermInvalid(this, parameters);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitSuffixTermInvalid(this);
  }
}

/**
 * Class holding all suffix trailers
 */
export class SuffixTrailer extends SuffixTermBase {
  /**
   * Grammar for the suffix trailers
   */
  public static grammar: GrammarNode[];

  /**
   * Constructor for the suffix trailer
   * @param suffixTerm base suffix term
   * @param colon colon separating the base from the trailer
   * @param trailer the suffix trailer
   */
  constructor(
    public readonly suffixTerm: SuffixTerm,
    public colon?: Token,
    public trailer?: SuffixTrailer,
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

        if (lastTrailer instanceof BracketIndex) {
          return lastTrailer.open.tracker;
        }

        if (lastTrailer instanceof HashIndex) {
          return undefined;
        }

        if (lastTrailer instanceof Call) {
          return lastTrailer.open.tracker;
        }

        return undefined;
      }

      // check nested trailers
      if (atom instanceof Identifier) {
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
      const [joinLine, ...restLines] = this.trailer.toLines();

      if (suffixTermLines.length === 1) {
        return [`${suffixTermLines[0]}${this.colon.lexeme}${joinLine}`].concat(
          restLines,
        );
      }

      return suffixTermLines
        .slice(0, suffixTermLines.length - 2)
        .concat(
          `${suffixTermLines[0]}${this.colon.lexeme}${joinLine}`,
          restLines,
        );
    }

    return suffixTermLines;
  }

  public accept<T extends (...args: any) => any>(
    visitor: ISuffixTermVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitSuffixTrailer(this, parameters);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitSuffixTrailer(this);
  }
}

/**
 * Class holding all valid suffix terms
 */
export class SuffixTerm extends SuffixTermBase {
  /**
   * Grammer for the suffix terms
   */
  public static grammar: GrammarNode[];

  /**
   * Constructor for suffix terms
   * @param atom base item of the suffix term
   * @param trailers trailers present in the suffixterm
   */
  constructor(
    public readonly atom: Atom,
    public readonly trailers: SuffixTermTrailer[],
  ) {
    super();
  }
  public get ranges(): Range[] {
    return [this.atom as Range, ...(this.trailers as Range[])];
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
  public toLines(): string[] {
    const atomLines = this.atom.toLines();
    const trailersLines = this.trailers.map(t => t.toLines());

    return joinLines('', atomLines, ...trailersLines);
  }

  public accept<T extends (...args: any) => any>(
    visitor: ISuffixTermVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitSuffixTerm(this, parameters);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitSuffixTerm(this);
  }
}

/**
 * Class containing all valid call suffixterm trailers
 */
export class Call extends SuffixTermBase {
  /**
   * Grammer for the call trailers
   */
  public static grammar: GrammarNode[];

  /**
   * Constructor for the suffix term trailers
   * @param open open paren of the call
   * @param args arguments for the call
   * @param close close paren of the call
   */
  constructor(
    public readonly open: Token,
    public readonly args: IExpr[],
    public readonly close: Token,
  ) {
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

  public toLines(): string[] {
    if (this.args.length === 0) {
      return [`${this.open.lexeme}${this.close.lexeme}`];
    }

    const argsLines = this.args.map(a => a.toLines());
    const argsResult = joinLines(',', ...argsLines);

    argsResult[0] = `${this.open.lexeme}${argsResult[0]}`;
    argsResult[argsResult.length - 1] = `${argsResult[argsResult.length - 1]}${
      this.close.lexeme
    }`;
    return argsResult;
  }

  public accept<T extends (...args: any) => any>(
    visitor: ISuffixTermVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitCall(this, parameters);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitCall(this);
  }
}

/**
 * Class containing all array index suffix term trailers
 */
export class HashIndex extends SuffixTermBase {
  /**
   * Grammar for the array index suffix term trailers
   */
  public static grammar: GrammarNode[];

  /**
   * Constructor for the suffix term trailer
   * @param indexer "#" token indicating a index
   * @param index index to be used
   */
  constructor(public readonly indexer: Token, public readonly index: Token) {
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

  public toLines(): string[] {
    return [`${this.indexer.lexeme}${this.index.lexeme}`];
  }

  public accept<T extends (...args: any) => any>(
    visitor: ISuffixTermVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitHashIndex(this, parameters);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitHashIndex(this);
  }
}

/**
 * Class containing all valid array bracket suffix term trailers
 */
export class BracketIndex extends SuffixTermBase {
  /**
   * Grammar for the array bracket suffix term
   */
  public static grammar: GrammarNode[];

  /**
   * Constructor for the array bracket suffix term trailer
   * @param open open bracket
   * @param index index into the collection
   * @param close close bracket
   */
  constructor(
    public readonly open: Token,
    public readonly index: IExpr,
    public readonly close: Token,
  ) {
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

  public toLines(): string[] {
    const lines = this.index.toLines();

    lines[0] = `${this.open.lexeme}${lines[0]}`;
    lines[lines.length - 1] = `${lines[lines.length - 1]}${this.close.lexeme}`;
    return lines;
  }

  public accept<T extends (...args: any) => any>(
    visitor: ISuffixTermVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitBracketIndex(this, parameters);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitBracketIndex(this);
  }
}

/**
 * Class containing function delgate creation suffix terms
 */
export class Delegate extends SuffixTermBase {
  /**
   * Grammar for the delgate
   */
  public static grammar: GrammarNode[];

  /**
   * Constructor for the function delegate
   * @param atSign at sign indicating that function should create a delgate
   */
  constructor(public readonly atSign: Token) {
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

  public toLines(): string[] {
    return [this.atSign.lexeme];
  }

  public accept<T extends (...args: any) => any>(
    visitor: ISuffixTermVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitDelegate(this, parameters);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitDelegate(this);
  }
}

/**
 * Class containing literal suffix terms
 */
export class Literal extends SuffixTermBase {
  /**
   * Grammar for literal suffix terms
   */
  public static grammar: GrammarNode[];

  /**
   * Constructor for literal suffix term
   * @param token token for the literal
   */
  constructor(public readonly token: Token) {
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

  public toLines(): string[] {
    return [`${this.token.lexeme}`];
  }

  public accept<T extends (...args: any) => any>(
    visitor: ISuffixTermVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitLiteral(this, parameters);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitLiteral(this);
  }
}

/**
 * Class containing all valid identifiers
 */
export class Identifier extends SuffixTermBase {
  /**
   * Grammar for valid identifiers
   */
  public static grammar: GrammarNode[];

  /**
   * Constructor for suffix term identifiers
   * @param token identifier token
   */
  constructor(public readonly token: Token) {
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
    return !(
      this.token.type === TokenType.identifier ||
      this.token.type === TokenType.fileIdentifier
    );
  }

  public toLines(): string[] {
    return [`${this.token.lexeme}`];
  }

  public accept<T extends (...args: any) => any>(
    visitor: ISuffixTermVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitIdentifier(this, parameters);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitIdentifier(this);
  }
}

/**
 * Class containing all valid groupings
 */
export class Grouping extends SuffixTermBase {
  /**
   * Grammar for all valid groupings
   */
  public static grammar: GrammarNode[];

  /**
   * Grouping constructor
   * @param open open paren token
   * @param expr expression within the grouping
   * @param close close paren token
   */
  constructor(
    public readonly open: Token,
    public readonly expr: IExpr,
    public readonly close: Token,
  ) {
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

  public toLines(): string[] {
    const lines = this.expr.toLines();

    lines[0] = `${this.open.lexeme}${lines[0]}`;
    lines[lines.length - 1] = `${lines[lines.length - 1]}${this.close.lexeme}`;
    return lines;
  }

  public accept<T extends (...args: any) => any>(
    visitor: ISuffixTermVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitGrouping(this, parameters);
  }

  public static classAccept<T>(visitor: ISuffixTermClassVisitor<T>): T {
    return visitor.visitGrouping(this);
  }
}

/**
 * All valid suffix terms
 */
export const validSuffixTerms: Constructor<SuffixTermBase>[] = [
  SuffixTrailer,
  SuffixTerm,
  Call,
  HashIndex,
  BracketIndex,
  Delegate,
  Literal,
  Identifier,
  Grouping,
];

const atomTypes: [ISuffixTermClass, Distribution][] = [
  [Literal, createConstant(0.8)],
  [Identifier, createConstant(1)],
  [Grouping, createConstant(0.3)],
];

const suffixTermTrailers: [ISuffixTermClass, Distribution][] = [
  [Call, createConstant(0.8)],
  [BracketIndex, createConstant(1)],
  [HashIndex, createConstant(0.3)],
];

const atom = createGrammarUnion(...atomTypes);
const suffixTermTrailer = createGrammarUnion(...suffixTermTrailers);

SuffixTerm.grammar = [
  atom,
  createGrammarRepeat(createExponential(1.5), suffixTermTrailer),
];

Call.grammar = [
  TokenType.bracketOpen,
  createGrammarOptional(
    createExponential(3),
    expr,
    createGrammarRepeat(createGamma(1.5, 0.4), TokenType.comma, expr),
  ),
  TokenType.bracketClose,
];

HashIndex.grammar = [
  TokenType.arrayIndex,
  createGrammarUnion(
    [TokenType.integer, createNormal(3, 1)],
    [TokenType.identifier, createNormal(1, 1)],
  ),
];

BracketIndex.grammar = [TokenType.bracketOpen, expr, TokenType.bracketClose];

Delegate.grammar = [TokenType.atSign];

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

Identifier.grammar = [TokenType.identifier];

Grouping.grammar = [TokenType.bracketOpen, expr, TokenType.bracketClose];
