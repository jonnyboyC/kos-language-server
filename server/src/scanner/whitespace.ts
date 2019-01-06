import { IWhiteSpace } from './types';

export class WhiteSpace implements IWhiteSpace {
  get tag(): 'whitespace' {
    return 'whitespace';
  }
}
