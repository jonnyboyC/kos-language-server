import { IRangeSequence } from './types';
import { Location, Position, Range } from 'vscode-languageserver';

export abstract class NodeBase implements IRangeSequence {
  /**
   * Array of all valid ranges in the syntax node
   */
  public abstract get ranges(): Range[];

  /**
   * To string representation of the syntax node
   */
  public abstract toString(): string;

  /**
   * Position of start of syntax node
   */
  public abstract get start(): Position;

  /**
   * Position of end of syntax node
   */
  public abstract get end(): Position;

  /**
   * Create a uri location for this node element
   * @param uri uri to set location to
   */
  public toLocation(uri: string): Location {
    return { uri, range: { start: this.start, end: this.end } };
  }
}
