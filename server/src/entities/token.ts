import { TokenType } from './tokentypes';
import { Position } from 'vscode-languageserver';
import { IToken } from './types';

export class Token implements IToken {
  public readonly type: TokenType;
  public readonly lexeme: string;
  public readonly literal: any;
  public readonly start: Marker;
  public readonly end: Marker;
  public readonly file?: string;

  constructor(
    type: TokenType,
    lexeme: string,
    literal: any,
    start: Marker,
    end: Marker,
    file?: string) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.start = start;
    this.end = end;
    this.file = file;
  }

  public get tag(): 'token' {
    return 'token';
  }

  public get typeString(): string {
    return TokenType[this.type];
  }

  public toString(): string {
    if (this.literal) {
      return `${this.typeString} ${this.lexeme} ${this.literal}`;
    }
    return `${this.typeString} ${this.lexeme}`;
  }
}

export class Marker implements Position {
  public readonly line: number;
  public readonly character: number;
  public readonly file?: string;

  constructor(line: number, character: number, file?: string) {
    this.line = line;
    this.character = character;
    this.file = file;
  }
}

export class MutableMarker implements Position {
  public line: number;
  public character: number;
  public file?: string;

  constructor(line: number, character: number, file?: string) {
    this.line = line;
    this.character = character;
    this.file = file;
  }

  public toImmutable(): Marker {
    return new Marker(this.line, this.character, this.file);
  }
}
