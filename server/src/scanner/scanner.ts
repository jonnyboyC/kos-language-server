import { TokenType } from '../entities/tokentypes';
import { ITokenMap, IScanResult, ScanKind } from './types';
import { Token } from '../entities/token';
import { empty } from '../utilities/typeGuards';
import { mockLogger, mockTracer } from '../utilities/logger';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { createDiagnostic } from '../utilities/diagnosticsUtils';
import { MutableMarker } from '../entities/marker';

type Result<T, S extends ScanKind> = {
  result: T;
  kind: S;
};

type TokenResult = Result<Token, ScanKind.Token>;
type WhitespaceResult = Result<null, ScanKind.Whitespace>;
type DiagnosticResult = Result<Diagnostic, ScanKind.Diagnostic>;

type ScanResult = TokenResult | WhitespaceResult | DiagnosticResult;

/**
 * Class for scanning kerboscript files
 */
export class Scanner {
  /**
   * source string for scanning
   */
  private source: string;

  /**
   * start character of current token
   */
  private start: number;

  /**
   * current character position
   */
  private current: number;

  /**
   * current line and character position
   */
  private currentPosition: MutableMarker;

  /**
   * start character and line of current token
   */
  private startPosition: MutableMarker;

  /**
   * uri of the source file
   */
  private uri: string;

  /**
   * logger for the scanner
   */
  private readonly logger: ILogger;

  /**
   * tracer for the scanner
   */
  private readonly tracer: ITracer;

  /**
   * results for tokens
   */
  private readonly tokenResult: TokenResult;

  /**
   * results for whitespace
   */
  private readonly whiteSpaceResult: WhitespaceResult;

  /**
   * results for diagnostic
   */
  private readonly diagnosticResult: DiagnosticResult;

  /**
   * Scanner constructor
   * @param source source string
   * @param uri source uri
   * @param logger logger for scanner
   * @param tracer tracer for scanner
   */
  constructor(
    source: string,
    uri: string = '',
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer,
  ) {
    this.source = source;
    this.logger = logger;
    this.tracer = tracer;
    this.uri = uri;
    this.start = 0;
    this.current = 0;
    this.startPosition = new MutableMarker(0, 0);
    this.currentPosition = new MutableMarker(0, 0);

    this.tokenResult = {
      result: new Token(
        TokenType.not,
        'placeholder',
        undefined,
        { line: 0, character: 0 },
        { line: 0, character: 0 },
        'placeholder',
      ),
      kind: ScanKind.Token,
    };

    this.whiteSpaceResult = {
      result: null,
      kind: ScanKind.Whitespace,
    };

    this.diagnosticResult = {
      result: Diagnostic.create(
        {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
        'placeholder',
      ),
      kind: ScanKind.Diagnostic,
    };
  }

  /**
   * scan all available tokens
   */
  public scanTokens(): IScanResult {
    try {
      // create arrays for valid tokens and encountered errors
      const tokens: Token[] = [];
      const scanErrors: Diagnostic[] = [];

      const splits = this.uri.split('/');
      const file = splits[splits.length - 1];

      this.logger.info(
        `Scanning started for ${file} with ${this.source.length} characters.`,
      );

      // begin scanning
      while (!this.isAtEnd()) {
        this.start = this.current;
        this.startPosition.character = this.currentPosition.character;
        this.startPosition.line = this.currentPosition.line;

        const result = this.scanToken();
        switch (result.kind) {
          case ScanKind.Token:
            tokens.push(result.result);
            break;
          case ScanKind.Diagnostic:
            scanErrors.push(result.result);
            break;
          case ScanKind.Whitespace:
            break;
        }
      }

      this.logger.info(
        `Scanning finished for ${file} with ${tokens.length} tokens.`,
      );
      if (scanErrors.length > 0) {
        this.logger.warn(`Scanning encounted ${scanErrors.length} errors`);
      }

      return { tokens, scanErrors };
    } catch (err) {
      this.logger.error(`Error occured in scanner ${err}`);
      this.tracer.log(err);

      return {
        tokens: [],
        scanErrors: [],
      };
    }
  }

  /**
   * Scan a single token
   */
  private scanToken(): ScanResult {
    const c = this.advance();
    switch (c) {
      case '(':
        return this.generateToken(TokenType.bracketOpen);
      case ')':
        return this.generateToken(TokenType.bracketClose);
      case '{':
        return this.generateToken(TokenType.curlyOpen);
      case '}':
        return this.generateToken(TokenType.curlyClose);
      case '[':
        return this.generateToken(TokenType.squareOpen);
      case ']':
        return this.generateToken(TokenType.squareClose);
      case ',':
        return this.generateToken(TokenType.comma);
      case ':':
        return this.generateToken(TokenType.colon);
      case '@':
        return this.generateToken(TokenType.atSign);
      case '#':
        return this.generateToken(TokenType.arrayIndex);

      case '^':
        return this.generateToken(TokenType.power);
      case '+':
        return this.generateToken(TokenType.plus);
      case '-':
        return this.generateToken(TokenType.minus);
      case '*':
        return this.generateToken(TokenType.multi);
      case '=':
        return this.generateToken(TokenType.equal);
      case '.':
        if (this.isDigit(this.peekNext())) {
          this.decrement();
          return this.number();
        }
        return this.generateToken(TokenType.period);
      case '<':
        if (this.match('=')) return this.generateToken(TokenType.lessEqual);
        if (this.match('>')) return this.generateToken(TokenType.notEqual);
        return this.generateToken(TokenType.less);
      case '>':
        if (this.match('=')) return this.generateToken(TokenType.greaterEqual);
        return this.generateToken(TokenType.greater);
      case '/':
        if (this.match('/')) {
          while (this.peek() !== '\n' && !this.isAtEnd()) this.increment();
          return this.whiteSpaceResult;
        }
        return this.generateToken(TokenType.div);
      case ' ':
      case '\r':
      case '\t':
        return this.whiteSpaceResult;
      case '\n':
        this.incrementLine();
        return this.whiteSpaceResult;
      case '"':
        return this.string();
      default:
        if (this.isDigit(c)) {
          return this.number();
        }
        if (this.isAlpha(c)) {
          return this.identifier();
        }
        return this.generateError(
          `Unexpected symbol, uncountered ${this.source.substr(
            this.start,
            this.current - this.start,
          )}`,
        );
    }
  }

  /**
   * extract any identifiers
   */
  private identifier(): TokenResult {
    while (this.isAlphaNumeric(this.peek())) this.increment();

    // if "." immediatily followed by alpha numeri
    if (this.peek() === '.' && this.isAlphaNumeric(this.peekNext())) {
      return this.fileIdentifier();
    }

    const text = this.source
      .substr(this.start, this.current - this.start)
      .toLowerCase();
    const keyword = keywords.get(text);
    if (!empty(keyword)) {
      return this.generateToken(keyword.type, keyword.literal);
    }
    return this.generateToken(TokenType.identifier, undefined);
  }

  /**
   * extract a file identifier
   */
  private fileIdentifier(): TokenResult {
    while (
      this.isAlphaNumeric(this.peek()) ||
      (this.peek() === '.' && this.isAlphaNumeric(this.peekNext()))
    ) {
      this.increment();
      while (this.isAlphaNumeric(this.peek())) this.increment();
    }

    const value = this.source
      .substr(this.start, this.current - this.start)
      .toLowerCase();
    return this.generateToken(TokenType.fileIdentifier, value);
  }

  /**
   * extract a string
   */
  private string(): ScanResult {
    // while closing " not found increment new lines
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') this.incrementLine();
      this.increment();
    }

    // if closing " not found report error
    if (this.isAtEnd()) {
      return this.generateError('Expected closing " for string');
    }

    // generate literal
    this.increment();
    const value = this.source.substr(
      this.start + 1,
      this.current - this.start - 2,
    );
    return this.generateToken(TokenType.string, value);
  }

  /**
   * extract a number
   */
  private number(): TokenResult | DiagnosticResult {
    let isFloat = this.advanceNumber();
    const possibleNumber = this.generateNumber(isFloat);

    this.advanceWhitespace();

    const current = this.peek();
    let next = this.peekNext();

    // check if exponent
    if (
      !(current === 'e' || current === 'E') ||
      !(
        next === '+' ||
        next === '-' ||
        this.isWhitespace(next) ||
        this.isDigit(next)
      )
    ) {
      return possibleNumber;
    }

    isFloat = true;

    // parse optional exponent sign
    next = this.peekNext();
    while (this.isWhitespace(next) || next === '+' || next === '-') {
      this.increment();
      next = this.peekNext();
    }

    // unsure number follows exponent
    if (!this.isDigit(this.peekNext())) {
      return this.generateError('Expected number following exponet e');
    }

    // advance exponent number
    this.increment();
    this.advanceNumber();

    // generate float
    return this.generateNumber(isFloat);
  }

  /**
   * advance a number as either an int or double
   */
  private advanceNumber(): boolean {
    this.advanceNumberComponent();
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.increment();
      this.advanceNumberComponent();
      return true;
    }

    return false;
  }

  /**
   * advance a number before or after a period
   */
  private advanceNumberComponent(): void {
    let current = this.peek();
    while (this.isDigit(current) || current === '_') {
      this.increment();
      current = this.peek();
    }
  }

  /**
   * advance through whitespace
   */
  private advanceWhitespace(): void {
    let current = this.peek();
    while (this.isWhitespace(current)) {
      this.increment();
      current = this.peek();
    }
  }

  /**
   * remove underscores from number and generate token
   * @param isFloat is the token a float
   */
  private generateNumber(isFloat: boolean): TokenResult {
    const numberString = this.source
      .substr(this.start, this.current - this.start)
      .replace(/(\_)/g, '');

    return isFloat
      ? this.generateToken(TokenType.double, parseFloat(numberString))
      : this.generateToken(TokenType.integer, parseInt(numberString, 10));
  }

  /**
   * generate token from provided token type and optional literal
   * @param type token type
   * @param literal optional literal
   * @param toLower should the lexeme be lowered
   */
  private generateToken(
    type: TokenType,
    literal?: any,
  ): TokenResult {
    const text = this.source.substr(this.start, this.current - this.start);

    const token = new Token(
      type,
      text,
      literal,
      this.startPosition.toImmutable(),
      this.currentPosition.toImmutable(),
      this.uri,
    );

    this.tokenResult.result = token;
    return this.tokenResult;
  }

  /**
   * generate error
   * @param message error message
   */
  private generateError(message: string): DiagnosticResult {
    const diagnostic = createDiagnostic(
      {
        start: this.startPosition.toImmutable(),
        end: this.currentPosition.toImmutable(),
      },
      message,
      DiagnosticSeverity.Error,
    );

    this.diagnosticResult.result = diagnostic;
    return this.diagnosticResult;
  }

  /**
   * increment line
   */
  private incrementLine(): void {
    this.currentPosition.line += 1;
    this.currentPosition.character = 0;
  }

  /**
   * Decrement the file pointer 1 character
   */
  private decrement(): void {
    this.current -= 1;
    this.currentPosition.character -= 1;
  }

  /**
   * Increment the file pointer 1 character
   */
  private increment(): void {
    this.current += 1;
    this.currentPosition.character += 1;
  }

  /**
   * Is the pointer current at the end of the file
   */
  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  /**
   * Peek ahead one character, return null character if past
   * the end
   */
  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1];
  }

  /**
   * Peek the current chacter return null character is past
   * the end
   */
  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  /**
   * Advance the pointer 1 character returning the current
   * character
   */
  private advance(): string {
    this.increment();
    return this.source[this.current - 1];
  }

  /**
   * Match a character, returns if match was found
   * @param expected character
   */
  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;

    this.increment();
    return true;
  }

  /**
   * Is the character whitespace
   * @param c character to inspect
   */
  private isWhitespace(c: string): boolean {
    return c === ' ' || c === '\r' || c === '\t';
  }

  /**
   * Is the character a digit
   * @param c character to inspect
   */
  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  /**
   * Is the character an alphabet character
   * @param c character to inspect
   */
  private isAlpha(c: string): boolean {
    return this.isAscii(c) || c === '_' || identifierTest.test(c);
  }

  /**
   * Is the current character an ascii character
   * @param c character to inspect
   */
  private isAscii(c: string): boolean {
    return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
  }

  /**
   * Is the character alpha numeric
   * @param c character to inspect
   */
  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }
}

// defines unicode range of all language letters
const identifierTest = /\p{L}/u;

// keyword map
const keywords: ITokenMap = new Map([
  ['add', { type: TokenType.add }],
  ['and', { type: TokenType.and }],
  ['all', { type: TokenType.all }],
  ['at', { type: TokenType.at }],
  ['break', { type: TokenType.break }],
  ['clearscreen', { type: TokenType.clearscreen }],
  ['compile', { type: TokenType.compile }],
  ['copy', { type: TokenType.copy }],
  ['do', { type: TokenType.do }],
  ['declare', { type: TokenType.declare }],
  ['defined', { type: TokenType.defined }],
  ['delete', { type: TokenType.delete }],
  ['edit', { type: TokenType.edit }],
  ['else', { type: TokenType.else }],
  ['false', { type: TokenType.false, literal: false }],
  ['file', { type: TokenType.file }],
  ['for', { type: TokenType.for }],
  ['from', { type: TokenType.from }],
  ['function', { type: TokenType.function }],
  ['global', { type: TokenType.global }],
  ['if', { type: TokenType.if }],
  ['in', { type: TokenType.in }],
  ['is', { type: TokenType.is }],
  ['lazyglobal', { type: TokenType.lazyGlobal }],
  ['list', { type: TokenType.list }],
  ['local', { type: TokenType.local }],
  ['lock', { type: TokenType.lock }],
  ['log', { type: TokenType.log }],
  ['not', { type: TokenType.not }],
  ['off', { type: TokenType.off }],
  ['on', { type: TokenType.on }],
  ['or', { type: TokenType.or }],
  ['once', { type: TokenType.once }],
  ['parameter', { type: TokenType.parameter }],
  ['preserve', { type: TokenType.preserve }],
  ['print', { type: TokenType.print }],
  ['reboot', { type: TokenType.reboot }],
  ['remove', { type: TokenType.remove }],
  ['rename', { type: TokenType.rename }],
  ['return', { type: TokenType.return }],
  ['run', { type: TokenType.run }],
  ['runpath', { type: TokenType.runPath }],
  ['runoncepath', { type: TokenType.runOncePath }],
  ['set', { type: TokenType.set }],
  ['shutdown', { type: TokenType.shutdown }],
  ['stage', { type: TokenType.stage }],
  ['step', { type: TokenType.step }],
  ['switch', { type: TokenType.switch }],
  ['then', { type: TokenType.then }],
  ['to', { type: TokenType.to }],
  ['true', { type: TokenType.true, literal: true }],
  ['toggle', { type: TokenType.toggle }],
  ['unlock', { type: TokenType.unlock }],
  ['unset', { type: TokenType.unset }],
  ['until', { type: TokenType.until }],
  ['volume', { type: TokenType.volume }],
  ['wait', { type: TokenType.wait }],
  ['when', { type: TokenType.when }],
]);
