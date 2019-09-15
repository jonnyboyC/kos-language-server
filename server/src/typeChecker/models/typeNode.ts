import { SuffixTermBase } from '../../parser/models/suffixTerm';
import { Position, Range } from 'vscode-languageserver';
import { IType } from '../types';

/**
 * Storage type for suffix terms in the type checker
 */
export class TypeNode<T extends IType = IType> implements Range {
  /**
   * TypeNode constructor
   * @param type type at a suffix term node
   * @param node suffix term node
   */
  constructor(public readonly type: T, public readonly node: SuffixTermBase) {}

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
