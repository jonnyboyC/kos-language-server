import { TokenType } from '../entities/tokentypes';
import { ITokenMap, IScanResult, ScanKind } from './types';
import { Token } from '../entities/token';
import { empty } from '../utilities/typeGuards';
import { mockLogger, mockTracer, logException } from '../utilities/logger';
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
type RegionResult = Result<Token, ScanKind.Region>;

type ScanResult =
  | TokenResult
  | WhitespaceResult
  | DiagnosticResult
  | RegionResult;

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
   * results for regions
   */
  private readonly regionResult: RegionResult;

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

    this.regionResult = {
      result: new Token(
        TokenType.region,
        'placeholder',
        undefined,
        { line: 0, character: 0 },
        { line: 0, character: 0 },
        'placeholder',
      ),
      kind: ScanKind.Region,
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
      const regions: Token[] = [];

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
          case ScanKind.Region:
            regions.push(result.result);
            break;
          case ScanKind.Whitespace:
            break;
        }
      }

      this.logger.info(
        `Scanning finished for ${file} with ${tokens.length} tokens.`,
      );
      if (scanErrors.length > 0) {
        this.logger.warn(`Scanning encounter ${scanErrors.length} errors`);
      }

      return { tokens, scanErrors };
    } catch (err) {
      this.logger.error('Error occurred in scanner');
      logException(this.logger, this.tracer, err, LogLevel.error);

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
          return this.comment();
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
          `Unexpected symbol, encountered ${this.source.substr(
            this.start,
            this.current - this.start,
          )}`,
        );
    }
  }

  /**
   * Extract a comment or a region
   */
  private comment(): WhitespaceResult | RegionResult {
    this.advanceWhitespace();
    if (this.peek() !== '#') {
      this.advanceEndOfLine();
      return this.whiteSpaceResult;
    }

    this.increment();
    const start = this.current;
    while (this.isAlpha(this.peek())) this.increment();

    const text = this.source.substr(start, this.current - start).toLowerCase();

    const region = regions.get(text);

    this.advanceWhitespace();
    return empty(region)
      ? this.whiteSpaceResult
      : this.generateRegion(region.type);
  }

  /**
   * extract any identifiers
   */
  private identifier(): TokenResult {
    while (this.isAlphaNumeric(this.peek())) this.increment();

    // if "." immediately followed by alpha numeric
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
      return this.generateError('Expected number following exponent e');
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
    // let current = this.peek();
    while (this.isWhitespace(this.peek())) {
      this.increment();
      // current = this.peek();
    }
  }

  /**
   * advance to end of line
   */
  private advanceEndOfLine(): void {
    while (this.peek() !== '\n' && !this.isAtEnd()) {
      this.increment();
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
  private generateToken(type: TokenType, literal?: any): TokenResult {
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
   * generate a region from provided token type
   * @param type token type
   */
  private generateRegion(type: TokenType): RegionResult {
    const text = this.source.substr(this.start, this.current - this.start);

    const token = new Token(
      type,
      text,
      undefined,
      this.startPosition.toImmutable(),
      this.currentPosition.toImmutable(),
      this.uri,
    );

    this.regionResult.result = token;
    return this.regionResult;
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
   * Peek the current character return null character is past
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
const identifierTest = new RegExp(
  '^[\u0041-\u005A\u0061-\u007A\u00AA\u00B5\u00BA\u00C0-' +
    '\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-' +
    '\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-' +
    '\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-' +
    '\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559' +
    '\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A' +
    '\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE' +
    '\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-' +
    '\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-' +
    '\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-' +
    '\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-' +
    '\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-' +
    '\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE' +
    '\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A' +
    '\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33' +
    '\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-' +
    '\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-' +
    '\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0' +
    '\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-' +
    '\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D' +
    '\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90' +
    '\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3' +
    '\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C' +
    '\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39' +
    '\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-' +
    '\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD' +
    '\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-' +
    '\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-' +
    '\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD' +
    '\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46' +
    '\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-' +
    '\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA' +
    '\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4' +
    '\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C' +
    '\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-' +
    '\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081' +
    '\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-' +
    '\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D' +
    '\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5' +
    '\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-' +
    '\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-' +
    '\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-' +
    '\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-' +
    '\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7' +
    '\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5' +
    '\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB' +
    '\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-' +
    '\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-' +
    '\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-' +
    '\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-' +
    '\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-' +
    '\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4' +
    '\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-' +
    '\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-' +
    '\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-' +
    '\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-' +
    '\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E' +
    '\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4' +
    '\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D' +
    '\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-' +
    '\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-' +
    '\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006' +
    '\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F' +
    '\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E' +
    '\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC' +
    '\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F' +
    '\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5' +
    '\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793' +
    '\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A' +
    '\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7' +
    '\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-' +
    '\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B' +
    '\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6' +
    '\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA' +
    '\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16' +
    '\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3' +
    '\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9' +
    '\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-' +
    '\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44' +
    '\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7' +
    '\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A' +
    '\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF' +
    '\uFFD2-\uFFD7\uFFDA-\uFFDC]*$',
);

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
  ['choose', { type: TokenType.choose }],
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

// region map
const regions: ITokenMap = new Map([
  ['region', { type: TokenType.region }],
  ['endregion', { type: TokenType.endRegion }],
]);
