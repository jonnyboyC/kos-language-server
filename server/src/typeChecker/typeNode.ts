import { Type } from './types/types';
import { SuffixTermBase } from '../parser/suffixTerm';
import { Position, Range } from 'vscode-languageserver';

/**
 * Storage type for suffix terms in the type checker
 */
export class TypeNode<T extends Type = Type> implements Range {
  /**
   * TypeNode constructor
   * @param type type at a suffix term node
   * @param node suffix term node
   */
  constructor(
    public readonly type: T,
    public readonly node: SuffixTermBase) { }

  /**
   * start position of the node
   */
  public get start(): Position {
    return this.node.start;
  }

  /**
   * end position of the node
   */
  public get end(): Position {
    return this.node.end;
  }
}
