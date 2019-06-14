import { RealEnvironmentRange } from './types';
import { Position } from 'vscode-languageserver';
import { ScopeKind } from '../parser/types';

export class ScopePosition implements RealEnvironmentRange {
  constructor(
    public start: Position,
    public end: Position) {
  }

  get kind(): ScopeKind.local {
    return ScopeKind.local;
  }
}
