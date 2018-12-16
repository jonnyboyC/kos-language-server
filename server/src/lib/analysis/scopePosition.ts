import { IRealScopePosition } from "./types";
import { Position } from "vscode-languageserver";

export class ScopePosition implements IRealScopePosition {
  constructor(
    public start: Position, 
    public end: Position) {
  }

  get tag(): 'real' {
    return 'real';
  }
}