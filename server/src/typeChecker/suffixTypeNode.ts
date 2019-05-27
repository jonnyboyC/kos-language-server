import { TypeNode } from './typeNode';
import { Type } from './types/types';

export class SuffixTypeBuilder {
  public nodes: TypeNode[];

  constructor() {
    this.nodes = [];
  }

  public isTrailer(): boolean {
    return this.nodes.length > 0;
  }

  public current(): Type {
    if (this.nodes.length > 0) {
      return this.nodes[this.nodes.length - 1].type;
    }

    throw new Error('Must have at least one node before current can be called');
  }
}
