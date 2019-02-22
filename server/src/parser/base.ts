import { IRangeSequence } from './types';
import { Location, Position, Range } from 'vscode-languageserver';

export abstract class NodeBase implements IRangeSequence {
  public abstract get ranges(): Range[];
  public abstract toString(): string;
  public abstract get start(): Position;
  public abstract get end(): Position;
  public toLocation(uri: string): Location {
    return { uri, range: { start: this.start, end: this.end } };
  }
}
