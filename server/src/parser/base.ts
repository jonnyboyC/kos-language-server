import { RangeSequence } from './types';
import { Location, Position, Range } from 'vscode-languageserver';
import { EOL } from 'os';

export abstract class NodeBase implements RangeSequence {
  /**
   * Array of all valid ranges in the syntax node
   */
  public abstract get ranges(): Range[];

  /**
   * String representation of the syntax node
   */
  public toString(): string {
    return this.toLines().join(EOL);
  }

  /**
   * String representation of the syntax node where each element is a line
   */
  public abstract toLines(): string[];

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
