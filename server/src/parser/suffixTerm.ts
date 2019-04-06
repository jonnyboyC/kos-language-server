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
import { linesJoin } from './toStringUtils';

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
  public abstract accept<T>(visitor: ISuffixTermVisitor<T>): T;

  /**
   * Require all subclass to implement the pass method
   * Call when the node should be passed through
   * @param visitor visitor object
   */
  public abstract pass<T>(visitor: ISuffixTermPasser<T>): T;
  public abstract acceptParam<TP, TR>(
    visitor: ISuffixTermParamVisitor<TP, TR>,
    param: TP): TR;
}

/**
 * Container for tokens constituting an invalid suffix term
 */
export class Invalid extends SuffixTermBase {

  /**
   * Invalid suffix term constructor
   * @param tokens tokens in the invalid range
   */
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

  public toLines(): string[] {
    return [this.tokens.join(', ')];
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

  /**
   * Method indicating if the suffix ends with a function or suffix call
   */
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

  public toLines(): string[] {
    const suffixTermLines = this.suffixTerm.toLines();

    if (!empty(this.colon) && !empty(this.trailer)) {
      const [joinLine, ...restLines] = this.trailer.toLines();

      if (suffixTermLines.length === 1) {
        return [`${suffixTermLines[0]}${this.colon.lexeme}${joinLine}`].concat(restLines);
      }

      return suffixTermLines.slice(0, suffixTermLines.length - 2)
        .concat(
          `${suffixTermLines[0]}${this.colon.lexeme}${joinLine}`,
          restLines);
    }

    return suffixTermLines;
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
  public toLines(): string[] {
    const atomLines = this.atom.toLines();
    const trailersLines = this.trailers.map(t => t.toLines());

    return linesJoin('', atomLines, ...trailersLines);
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
   * @param isTrailer indication if this is a trailer
   */
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

  public toLines(): string[] {
    const argsLines = this.args.map(a => a.toLines());
    const argsResult = linesJoin(',', ...argsLines);

    argsResult[0] = `${this.open.lexeme}${argsResult[0]}`;
    argsResult[argsResult.length - 1] = `${argsResult[argsResult.length - 1]}${this.close.lexeme}`;
    return argsResult;
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

/**
 * Class containing all array index suffix term trailers
 */
export class ArrayIndex extends SuffixTermBase {
  /**
   * Grammar for the array index suffix term trailers
   */
  public static grammar: GrammarNode[];

  /**
   * Constructor for the suffix term trailer
   * @param indexer # token indicating a index
   * @param index index to be used
   * @param isTrailer is the array index in a suffix trailer
   */
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

  public toLines(): string[] {
    return [`${this.indexer.lexeme}${this.index.lexeme}`];
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

/**
 * Class containing all valid array bracket suffix term trailers
 */
export class ArrayBracket extends SuffixTermBase {

  /**
   * Grammar for the array bracket suffix term
   */
  public static grammar: GrammarNode[];

  /**
   * Constructor for the array bracket suffix term trailer
   * @param open open bracket
   * @param index index into the collection
   * @param close close bracket
   * @param isTrailer is the suffix term a trailer
   */
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

  public toLines(): string[] {
    const lines = this.index.toLines();

    lines[0] = `${this.open.lexeme}${lines[0]}`;
    lines[lines.length - 1] = `${lines[lines.length - 1]}${this.close.lexeme}`;
    return lines;
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
   * @param isTrailer is the delgate a suffix trailer
   */
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

  public toLines(): string[] {
    return [this.atSign.lexeme];
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
   * @param isTrailer is a suffix trailer
   */
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

  public toLines(): string[] {
    return [`${this.token.lexeme}`];
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
   * @param isTrailer is suffix trailer
   */
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

  public toLines(): string[] {
    return [`${this.token.lexeme}`];
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
   * @param isTrailer is suffix trailer
   */
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

  public toLines(): string[] {
    const lines = this.expr.toLines();

    lines[0] = `${this.open.lexeme}${lines[0]}`;
    lines[lines.length - 1] = `${lines[lines.length - 1]}${this.close.lexeme}`;
    return lines;
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
