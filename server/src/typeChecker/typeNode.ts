import { ITypeNode } from './types';
import { IType } from './types/types';
import { SuffixTermBase } from '../parser/suffixTerm';
import { Position } from 'vscode-languageserver';

export class TypeNode<T extends IType = IType> implements ITypeNode<T> {
  constructor(
    public readonly type: T,
    public readonly node: SuffixTermBase) { }

  public get start(): Position {
    return this.node.start;
  }

  public get end(): Position {
    return this.node.end;
  }
}
