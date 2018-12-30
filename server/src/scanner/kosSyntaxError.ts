import { IScannerError } from './types';
import { Position } from 'vscode-languageserver';

export class ScannerError implements IScannerError {
  public readonly start: Position;
  public readonly end: Position;

  public readonly message: string;

  public constructor(message: string, start: Position, end: Position) {
    this.message = message;
    this.start = start;
    this.end = end;
  }

  public get tag(): 'scannerError' {
    return 'scannerError';
  }
}
