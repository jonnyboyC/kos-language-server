import { ITypeNode } from './types';
import { IType } from './types/types';
import { SuffixTermBase } from '../parser/suffixTerm';
import { Position } from 'vscode-languageserver';

/**
 * Storage type for suffix terms in the type checker
 */
export class TypeNode<T extends IType = IType> implements ITypeNode<T> {
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
