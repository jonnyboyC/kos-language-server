import { IType } from '../types';

export class SuffixTypeBuilder {
  public nodes: IType[];

  constructor() {
    this.nodes = [];
  }

  public isTrailer(): boolean {
    return this.nodes.length > 0;
  }

  public current(): IType {
    if (this.nodes.length > 0) {
      return this.nodes[this.nodes.length - 1];
    }

    throw new Error('Must have at least one node before current can be called');
  }
}
