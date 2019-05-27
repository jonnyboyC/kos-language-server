import { TypeNode } from './typeNode';
import { Type } from './types/types';

export class SuffixTypeNode {
  public nodes: TypeNode[];

  constructor() {
    this.nodes = [];
  }

  public current(): Maybe<Type> {
    if (this.nodes.length === 0) {
      return undefined;
    }

    return this.nodes[this.nodes.length - 1].type;
  }
}
