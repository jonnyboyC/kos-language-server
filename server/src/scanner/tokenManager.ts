import { IToken } from '../entities/types';
import { Position } from 'vscode-languageserver';
import { rangeContains, rangeBefore, rangeAfter } from '../utilities/positionHelpers';

export class TokenManager {
  constructor(
    public readonly tokens: IToken[]) {
  }

  // fid a token at a given position
  public find(pos: Position): Maybe<IToken> {
    let left = 0;
    let right = this.tokens.length - 1;

    while (left <= right) {
      const mid = Math.floor((right + left) / 2);
      if (rangeBefore(this.tokens[mid], pos)) {
        left = mid + 1;
      } else if (rangeAfter(this.tokens[mid], pos)) {
        right = mid - 1;
      } else if (rangeContains(this.tokens[mid], pos)) {
        return this.tokens[mid];
      } else {
        return undefined;
      }
    }

    return undefined;
  }
}
