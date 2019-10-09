import { Position } from 'vscode-languageserver';

/**
 * Implementation of vscode position interface
 */
export class Marker implements Position {
  public readonly line: number;
  public readonly character: number;

  constructor(line: number, character: number) {
    this.line = line;
    this.character = character;
  }
}

/**
 * A mutable implementation of vscode's position interface
 */
export class MutableMarker implements Position {
  public line: number;
  public character: number;

  constructor(line: number, character: number) {
    this.line = line;
    this.character = character;
  }

  /**
   * Create an immutable marker from this mutable marker
   */
  public toImmutable(): Marker {
    return new Marker(this.line, this.character);
  }
}
