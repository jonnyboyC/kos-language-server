import { WhiteSpaceInterface } from './types';

export class WhiteSpace implements WhiteSpaceInterface {
    get tag(): 'whitespace' {
        return 'whitespace';
    }
}